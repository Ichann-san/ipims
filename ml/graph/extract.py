"""Cut the active region out of a local OSM extract (Overpass is often unavailable).

Input:  ml/data/osm/east_java.osm.pbf (https://download.openstreetmap.fr/extracts/asia/indonesia/east_java.osm.pbf)
Output (per region, IPIMS_REGION):
        ml/data/osm/<region>_roads.osm        drivable highways (same exclusions as OSMnx network_type="drive")
        ml/data/osm/<region>_buildings.csv    building centroids (lon, lat)
        ml/data/osm/<region>_facilities.csv   facility points (fid, kind, name, lon, lat)
Buildings and facilities are written as CSV directly: dense cities have hundreds of thousands of buildings,
too many to parse back from OSM XML.
Run: python -m ml.graph.extract
"""
import csv
import re

import osmium
from osmium.filter import KeyFilter

from . import config as C

SOURCE = C.OSM_DIR / "east_java.osm.pbf"
ROADS = C.OSM_DIR / f"{C.REGION}_roads.osm"
BUILDINGS = C.OSM_DIR / f"{C.REGION}_buildings.csv"
FACILITIES = C.OSM_DIR / f"{C.REGION}_facilities.csv"

_NOT_DRIVE = re.compile(
    r"abandoned|bridleway|bus_guideway|construction|corridor|cycleway|elevator|escalator|footway|no|path|"
    r"pedestrian|planned|platform|proposed|raceway|razed|service|steps|track"
)
_NOT_DRIVE_SERVICE = re.compile(r"alley|driveway|emergency_access|parking|parking_aisle|private")
FEATURE_KEYS = ("building", "amenity", "shop", "office", "healthcare")


def is_drivable(tags) -> bool:
    hw = tags.get("highway")
    if not hw or _NOT_DRIVE.search(hw) or tags.get("area") == "yes":
        return False
    if tags.get("motor_vehicle") == "no" or tags.get("motorcar") == "no":
        return False
    return not _NOT_DRIVE_SERVICE.search(tags.get("service", ""))


def facility_kind(tags) -> str | None:
    """Most important facility kind matching the tags (config.FACILITY_TAGS), or None."""
    best = None
    for kind, rules in C.FACILITY_TAGS.items():
        if any(tags.get(key) in values for key, values in rules.items()):
            if best is None or C.FACILITY_WEIGHT[kind] > C.FACILITY_WEIGHT[best]:
                best = kind
    return best


def _locations(obj):
    if obj.is_node():
        return [obj.location]
    return [n.location for n in obj.nodes if n.location.valid()]


def extract(bounds: tuple[float, float, float, float]) -> dict:
    min_lng, min_lat, max_lng, max_lat = bounds
    counts = {"buildings": 0, "facilities": 0}
    with osmium.BackReferenceWriter(str(ROADS), ref_src=str(SOURCE), overwrite=True, remove_tags=False) as roads, \
         open(BUILDINGS, "w", newline="") as bf, open(FACILITIES, "w", newline="", encoding="utf-8") as ff:
        bw, fw = csv.writer(bf), csv.writer(ff)
        bw.writerow(["lon", "lat"])
        fw.writerow(["fid", "kind", "name", "lon", "lat"])
        processor = (
            osmium.FileProcessor(str(SOURCE), osmium.osm.NODE | osmium.osm.WAY)
            .with_locations()
            .with_filter(KeyFilter("highway", *FEATURE_KEYS))
        )
        for obj in processor:
            locs = _locations(obj)
            if not any(min_lng <= l.lon <= max_lng and min_lat <= l.lat <= max_lat for l in locs):
                continue
            if obj.is_way() and is_drivable(obj.tags):
                roads.add(obj)
                continue
            lon = sum(l.lon for l in locs) / len(locs)
            lat = sum(l.lat for l in locs) / len(locs)
            kind = facility_kind(obj.tags)
            if kind:
                fid = ("n" if obj.is_node() else "w") + str(obj.id)
                fw.writerow([fid, kind, obj.tags.get("name", ""), round(lon, 7), round(lat, 7)])
                counts["facilities"] += 1
            if obj.is_way() and "building" in obj.tags:
                bw.writerow([round(lon, 7), round(lat, 7)])
                counts["buildings"] += 1
    return counts


def main():
    import geopandas as gpd
    import osmnx as ox

    ox.settings.cache_folder = str(C.DATA_DIR / "osm_cache")
    ids = [f"R{rel_id}" for rel_id in C.KECAMATAN.values()]
    area = ox.geocode_to_gdf(ids, by_osmid=True)
    buffered = gpd.GeoSeries([area.union_all()], crs=4326).to_crs(C.METRIC_CRS).buffer(600).to_crs(4326)
    counts = extract(tuple(buffered.total_bounds))
    print(C.REGION, counts, "→", ROADS.name, BUILDINGS.name, FACILITIES.name)


if __name__ == "__main__":
    main()
