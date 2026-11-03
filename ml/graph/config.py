"""Pilot area and modelling assumptions for the Kediri infrastructure graph."""
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ML_DIR / "data"
ARTIFACTS_DIR = ML_DIR / "artifacts" / "graph"


# OSM relation ids of kecamatan (admin_level 6) in Kabupaten Kediri.
KECAMATAN = {
    "Pare": 16834524,
    "Badas": 16814394,
    "Plemahan": 15626570,
    "Gurah": 19613669,
}

# Assumed free-flow speeds (km/h) per OSM highway class.
SPEED_KMH = {
    "trunk": 50, "primary": 45, "secondary": 40, "tertiary": 35,
    "unclassified": 30, "residential": 25, "living_street": 15, "service": 15,
}
DEFAULT_SPEED_KMH = 20

# Traffic proxy per highway class (design doc §6).
TRAFFIC_PROXY = {
    "trunk": 1.0, "primary": 0.9, "secondary": 0.7, "tertiary": 0.5,
    "unclassified": 0.35, "residential": 0.3,
}
DEFAULT_TRAFFIC_PROXY = 0.2
UTAMA_CLASSES = {"trunk", "primary", "secondary"}

# Facility kinds, the OSM tags that define them, and their importance.
FACILITY_TAGS = {
    "health": {"amenity": ["hospital", "clinic", "doctors"], "healthcare": ["hospital", "clinic", "centre"]},
    "school": {"amenity": ["school", "college", "university", "kindergarten"]},
    "market": {"amenity": ["marketplace"], "shop": ["supermarket"]},
    "government": {"amenity": ["townhall"], "office": ["government"]},
}
FACILITY_WEIGHT = {"health": 1.0, "school": 0.7, "market": 0.6, "government": 0.5}

POPULATION_RADIUS_M = 250
FACILITY_RADIUS_M = 500
METRIC_CRS = 32749  # UTM 49S
