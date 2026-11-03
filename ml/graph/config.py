"""Regions and modelling assumptions for the infrastructure graph.

The active region comes from the environment variable IPIMS_REGION (default "surabaya").
Each region has its own artifacts under ml/artifacts/<region>/.
"""
import os
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ML_DIR / "data"
OSM_DIR = DATA_DIR / "osm"

# OSM relation ids of kecamatan (admin_level 6). `folds` = spatial folds for GNN evaluation.
REGIONS = {
    "surabaya": {
        "name": "Kota Surabaya",
        "folds": 5,
        "kecamatan": {
            "Asemrowo": 8224843, "Benowo": 8225081, "Bubutan": 8224671, "Bulak": 8224593,
            "Dukuh Pakis": 8225347, "Gayungan": 8225520, "Genteng": 8224396, "Gubeng": 8225432,
            "Gunung Anyar": 8225536, "Jambangan": 8225829, "Karang Pilang": 8225765, "Kenjeran": 8224558,
            "Krembangan": 8224636, "Lakarsantri": 8225133, "Mulyorejo": 8225259, "Pabean Cantian": 8225858,
            "Pakal": 8224860, "Rungkut": 8225437, "Sambikerep": 8225358, "Sawahan": 8224735,
            "Semampir": 8224478, "Simokerto": 8224405, "Sukolilo": 8225175, "Sukomanunggal": 8224825,
            "Tambaksari": 8225121, "Tandes": 8225068, "Tegalsari": 8225844, "Tenggilis Mejoyo": 8225522,
            "Wiyung": 8225727, "Wonocolo": 8225558, "Wonokromo": 8225796,
        },
    },
    "kediri": {
        "name": "Kabupaten Kediri (Pare dan sekitarnya)",
        "folds": 4,
        "kecamatan": {"Pare": 16834524, "Badas": 16814394, "Plemahan": 15626570, "Gurah": 19613669},
    },
}

REGION = os.environ.get("IPIMS_REGION", "surabaya")
if REGION not in REGIONS:
    raise ValueError(f"unknown IPIMS_REGION {REGION!r}; choose one of {', '.join(REGIONS)}")
REGION_NAME = REGIONS[REGION]["name"]
KECAMATAN = REGIONS[REGION]["kecamatan"]
FOLDS = REGIONS[REGION]["folds"]
ARTIFACTS_DIR = ML_DIR / "artifacts" / REGION / "graph"
GNN_DIR = ML_DIR / "artifacts" / REGION / "gnn"

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
