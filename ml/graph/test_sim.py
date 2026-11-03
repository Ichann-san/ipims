import numpy as np
import pandas as pd

from ml.graph.sim import Network, impact_to_score, recommend, single_segment_impact, whatif


def toy_network() -> Network:
    # 0 - 1 - 2 - 3 (hospital at 3), plus a slow detour 1 - 4 - 2. Everyone lives at node 0.
    nodes = pd.DataFrame({"node_id": [10, 11, 12, 13, 14], "population": [100, 0, 0, 0, 0],
                          "lon": [112.70, 112.71, 112.72, 112.73, 112.715], "lat": [-7.25] * 5})
    segments = pd.DataFrame({
        "segment_id": ["a", "b", "c", "d1", "d2"],
        "u": [10, 11, 12, 11, 14],
        "v": [11, 12, 13, 14, 12],
        "travel_min": [1.0, 1.0, 1.0, 1.5, 1.5],
        "length_m": [500, 500, 500, 1500, 1500],
        "road_group": ["utama", "utama", "utama", "lingkungan", "lingkungan"],
    })
    facilities = pd.DataFrame({"kind": ["health"], "node_id": [13]})
    return Network.from_frames(nodes, segments, facilities)


def test_baseline_accessibility_is_shortest_path():
    net = toy_network()
    A, by_kind = net.accessibility(net.base)
    assert by_kind["health"] == 3.0
    assert A == 3.0


def test_impact_only_on_shortest_path_and_bridge_is_worst():
    net = toy_network()
    impact = single_segment_impact(net, factor=5.0)
    by_id = dict(zip(net.seg_ids, impact))
    assert by_id["d1"] == 0 and by_id["d2"] == 0      # detour unused
    assert by_id["b"] == 2.0                          # detour (3 min) replaces 1 min
    assert by_id["a"] == 4.0 and by_id["c"] == 4.0    # no alternative: 5 min instead of 1
    score = impact_to_score(impact)
    assert score[net.seg_pos["d1"]] == 0
    assert score[net.seg_pos["a"]] == score[net.seg_pos["c"]] > score[net.seg_pos["b"]]


def test_whatif_and_recommend():
    net = toy_network()
    damage = {"a": 5.0, "b": 5.0}
    res = whatif(net, damage, ["a"])
    assert res["accessibility_baseline"] == 3.0
    assert res["accessibility_before"] > res["accessibility_after"] > 3.0
    assert 0 < res["improvement_pct"] < 100
    full = whatif(net, damage, ["a", "b"])
    assert np.isclose(full["accessibility_after"], 3.0) and full["improvement_pct"] == 100.0
    rec = recommend(net, damage)
    assert [r["segment_id"] for r in rec["order"]] == ["a", "b"]
    assert res["repaired_segments"] == ["a"]
    # Only the populated origin changes: 9 min before, 5 min after repairing "a".
    assert res["node_changes"] == [{"lng": 112.7, "lat": -7.25, "minutes_gained": 4.0, "population": 100}]


def test_parallel_segment_is_used_as_detour():
    net = toy_network()
    nodes = pd.DataFrame({"node_id": list(net.node_index), "population": net.pop})
    segments = pd.DataFrame({
        "segment_id": list(net.seg_ids) + ["a2"],
        "u": [10, 11, 12, 11, 14, 10], "v": [11, 12, 13, 14, 12, 11],
        "travel_min": [1.0, 1.0, 1.0, 1.5, 1.5, 3.0],
        "length_m": [500] * 6,
        "road_group": ["utama"] * 6,
    })
    par = Network.from_frames(nodes, segments, pd.DataFrame({"kind": ["health"], "node_id": [13]}))
    by_id = dict(zip(par.seg_ids, single_segment_impact(par, factor=5.0)))
    assert by_id["a"] == 2.0      # parallel road (3 min) replaces 1 min instead of 5
    assert by_id["a2"] == 0.0     # slower parallel road is not on the shortest path
