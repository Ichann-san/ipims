"""Cut the pilot area out of a local OSM extract (fallback when Overpass is unavailable).

Input:  ml/data/osm/east_java.osm.pbf (https://download.openstreetmap.fr/extracts/asia/indonesia/east_java.osm.pbf)
Output: ml/data/osm/pilot_roads.osm     drivable highways (same exclusions as OSMnx network_type="drive")
        ml/data/osm/pilot_features.osm  buildings and facility candidates
Run: python -m ml.graph.extract
"""
import re

import osmium
from osmium.filter import KeyFilter

from . import config as C

SOURCE = C.DATA_DIR / "osm" / "east_java.osm.pbf"
ROADS = C.DATA_DIR / "osm" / "pilot_roads.osm"
FEATURES = C.DATA_DIR / "osm" / "pilot_features.osm"

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


def _inside(obj, bounds) -> bool:
    min_lng, min_lat, max_lng, max_lat = bounds
    if obj.is_node():
        locs = [obj.location]
    else:
        locs = [n.location for n in obj.nodes if n.location.valid()]
    return any(min_lng <= l.lon <= max_lng and min_lat <= l.lat <= max_lat for l in locs)


def extract(bounds: tuple[float, float, float, float]) -> None:
    with osmium.BackReferenceWriter(str(ROADS), ref_src=str(SOURCE), overwrite=True, remove_tags=False) as roads, \
         osmium.BackReferenceWriter(str(FEATURES), ref_src=str(SOURCE), overwrite=True, remove_tags=False) as feats:
        processor = (
            osmium.FileProcessor(str(SOURCE), osmium.osm.NODE | osmium.osm.WAY)
            .with_locations()
            .with_filter(KeyFilter("highway", *FEATURE_KEYS))
        )
        for obj in processor:
            if not _inside(obj, bounds):
                continue
            if obj.is_way() and is_drivable(obj.tags):
                roads.add(obj)
            elif any(k in obj.tags for k in FEATURE_KEYS):
                feats.add(obj)


def main():
    import osmnx as ox
    import geopandas as gpd

    ox.settings.cache_folder = str(C.DATA_DIR / "osm_cache")
    ids = [f"R{rel_id}" for rel_id in C.KECAMATAN.values()]
    area = ox.geocode_to_gdf(ids, by_osmid=True)
    buffered = gpd.GeoSeries([area.union_all()], crs=4326).to_crs(C.METRIC_CRS).buffer(600).to_crs(4326)
    extract(tuple(buffered.total_bounds))
    print("wrote", ROADS, FEATURES)


if __name__ == "__main__":
    main()
