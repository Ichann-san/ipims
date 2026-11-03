"""Build the pilot infrastructure graph from OpenStreetMap.

Writes to ml/artifacts/graph/:
  nodes.csv            node_id, lon, lat, population (buildings assigned to the node)
  segments.geojson     one feature per physical road segment (undirected edge)
  facilities.geojson   facility points with their nearest graph node
  area.geojson         pilot kecamatan polygons
  build_info.json      counts and sources

Run: python -m ml.graph.build
"""
import json
import os
from datetime import datetime, timezone

import geopandas as gpd
import numpy as np
import osmnx as ox
import pandas as pd
from shapely.strtree import STRtree

from . import config as C


def _first(value):
    if isinstance(value, list):
        return value[0] if value else None
    if isinstance(value, float) and np.isnan(value):
        return None
    return value


def load_area() -> gpd.GeoDataFrame:
    ids = [f"R{rel_id}" for rel_id in C.KECAMATAN.values()]
    gdf = ox.geocode_to_gdf(ids, by_osmid=True)
    return gpd.GeoDataFrame({"kecamatan": list(C.KECAMATAN)}, geometry=gdf.geometry.values, crs=4326)


def load_facilities(polygon) -> gpd.GeoDataFrame:
    frames = []
    for kind, tags in C.FACILITY_TAGS.items():
        try:
            f = ox.features_from_polygon(polygon, tags=tags)
        except ox._errors.InsufficientResponseError:
            continue
        f = f.reset_index()
        f["kind"] = kind
        frames.append(f[["element", "id", "kind", "name", "geometry"]] if "name" in f else
                      f.assign(name=None)[["element", "id", "kind", "name", "geometry"]])
    fac = gpd.GeoDataFrame(pd.concat(frames, ignore_index=True), crs=4326)
    # A feature can match several kinds (e.g. clinic + government office); keep the most important.
    fac["rank"] = fac["kind"].map(C.FACILITY_WEIGHT)
    fac = fac.sort_values("rank", ascending=False).drop_duplicates(["element", "id"]).drop(columns="rank")
    fac["geometry"] = fac.to_crs(C.METRIC_CRS).geometry.centroid.to_crs(4326)
    fac["fid"] = fac["element"].str[0] + fac["id"].astype(str)
    return fac[["fid", "kind", "name", "geometry"]].reset_index(drop=True)


def load_buildings(polygon) -> gpd.GeoSeries:
    b = ox.features_from_polygon(polygon, tags={"building": True})
    b = b[b.geom_type.isin(["Polygon", "MultiPolygon"])]
    return b.to_crs(C.METRIC_CRS).geometry.centroid.reset_index(drop=True)


def build():
    C.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    ox.settings.cache_folder = str(C.DATA_DIR / "osm_cache")
    ox.settings.log_console = False
    ox.settings.requests_timeout = 600
    ox.settings.overpass_rate_limit = False
    if os.environ.get("OVERPASS_URL"):
        ox.settings.overpass_url = os.environ["OVERPASS_URL"]

    area = load_area()
    union = area.union_all()
    clip = gpd.GeoSeries([union], crs=4326).to_crs(C.METRIC_CRS).buffer(300).to_crs(4326).iloc[0]

    print("downloading road network…")
    G = ox.graph_from_polygon(clip, network_type="drive", simplify=True, truncate_by_edge=True)
    G = ox.truncate.largest_component(G, strongly=False)
    U = ox.convert.to_undirected(G)
    nodes_gdf, edges_gdf = ox.convert.graph_to_gdfs(U)

    print("downloading facilities and buildings…")
    facilities = load_facilities(clip)
    buildings = load_buildings(clip)

    nodes_m = nodes_gdf.to_crs(C.METRIC_CRS)
    node_ids = nodes_m.index.to_numpy()
    node_tree = STRtree(nodes_m.geometry.values)

    # Population proxy: each building counts for its nearest node.
    pop = np.zeros(len(node_ids))
    if len(buildings):
        nearest = node_tree.nearest(buildings.values)
        np.add.at(pop, nearest, 1)

    fac_m = facilities.to_crs(C.METRIC_CRS)
    facilities["node_id"] = node_ids[node_tree.nearest(fac_m.geometry.values)]

    # Segments: one row per undirected edge.
    edges = edges_gdf.reset_index()
    edges_m = edges.to_crs(C.METRIC_CRS)
    seg = pd.DataFrame({
        "segment_id": [f"{min(u, v)}-{max(u, v)}-{k}" for u, v, k in zip(edges["u"], edges["v"], edges["key"])],
        "u": edges["u"].to_numpy(),
        "v": edges["v"].to_numpy(),
        "name": [_first(n) for n in edges.get("name", pd.Series([None] * len(edges)))],
        "highway": [_first(h) or "unclassified" for h in edges["highway"]],
        "length_m": edges_m.geometry.length.round(1).to_numpy(),
    })
    seg["highway"] = seg["highway"].str.replace("_link", "", regex=False)
    speed = seg["highway"].map(C.SPEED_KMH).fillna(C.DEFAULT_SPEED_KMH)
    seg["travel_min"] = (seg["length_m"] / 1000) / speed * 60
    seg["road_group"] = np.where(seg["highway"].isin(C.UTAMA_CLASSES), "utama", "lingkungan")
    seg["traffic_proxy"] = seg["highway"].map(C.TRAFFIC_PROXY).fillna(C.DEFAULT_TRAFFIC_PROXY)

    # Population proxy per segment: buildings within radius, normalised by area max.
    if len(buildings):
        btree = STRtree(buildings.values)
        seg_idx, _ = btree.query(edges_m.geometry.values, predicate="dwithin", distance=C.POPULATION_RADIUS_M)
        counts = np.bincount(seg_idx, minlength=len(seg))
    else:
        counts = np.zeros(len(seg))
    seg["building_count"] = counts
    seg["population_proxy"] = np.round(counts / max(counts.max(), 1), 4)

    # Facility proxy: highest importance among facilities within radius.
    ftree = STRtree(fac_m.geometry.values)
    seg_idx, fac_idx = ftree.query(edges_m.geometry.values, predicate="dwithin", distance=C.FACILITY_RADIUS_M)
    weights = facilities["kind"].map(C.FACILITY_WEIGHT).to_numpy()
    fac_proxy = np.zeros(len(seg))
    np.maximum.at(fac_proxy, seg_idx, weights[fac_idx])
    seg["facility_proxy"] = fac_proxy

    # Kecamatan of each segment by midpoint.
    mids = gpd.GeoDataFrame(geometry=edges_m.geometry.interpolate(0.5, normalized=True), crs=C.METRIC_CRS).to_crs(4326)
    joined = gpd.sjoin(mids, area, how="left", predicate="within")
    seg["kecamatan"] = joined.groupby(level=0)["kecamatan"].first().reindex(range(len(seg))).to_numpy()

    seg_gdf = gpd.GeoDataFrame(seg, geometry=edges.geometry.values, crs=4326)
    seg_gdf = seg_gdf.drop_duplicates("segment_id")
    seg_gdf.to_file(C.ARTIFACTS_DIR / "segments.geojson", driver="GeoJSON")

    node_kec = gpd.sjoin(nodes_gdf[["geometry"]], area, how="left", predicate="within").groupby(level=0)["kecamatan"].first()
    pd.DataFrame({
        "node_id": node_ids,
        "lon": nodes_gdf["x"].to_numpy(),
        "lat": nodes_gdf["y"].to_numpy(),
        "population": pop,
        "kecamatan": node_kec.reindex(nodes_gdf.index).to_numpy(),
    }).to_csv(C.ARTIFACTS_DIR / "nodes.csv", index=False)

    facilities.to_file(C.ARTIFACTS_DIR / "facilities.geojson", driver="GeoJSON")
    area.to_file(C.ARTIFACTS_DIR / "area.geojson", driver="GeoJSON")

    info = {
        "built_at": datetime.now(timezone.utc).isoformat(),
        "source": "OpenStreetMap contributors (ODbL), via OSMnx",
        "kecamatan": list(C.KECAMATAN),
        "nodes": int(len(node_ids)),
        "segments": int(len(seg_gdf)),
        "segments_by_group": seg_gdf["road_group"].value_counts().to_dict(),
        "segments_by_kecamatan": seg_gdf["kecamatan"].fillna("outside").value_counts().to_dict(),
        "buildings": int(len(buildings)),
        "facilities": facilities["kind"].value_counts().to_dict(),
    }
    (C.ARTIFACTS_DIR / "build_info.json").write_text(json.dumps(info, indent=2))
    print(json.dumps(info, indent=2))


if __name__ == "__main__":
    build()
