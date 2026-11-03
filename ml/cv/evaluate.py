"""Evaluate category classification and train the deployed linear head.

Data: hand-checked Wikimedia Commons images (ml.cv.collect, minus ml/cv/rejected.txt).
Protocol: 5 random stratified 50/50 splits; zero-shot baseline vs linear head trained on the train half.
The head is trained on all images and deployed only if it beat zero-shot on the held-out halves.
Run: python -m ml.cv.evaluate
"""
import csv
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from .infer import CLASSES, HEAD_PATH, Analyzer

ML_DIR = Path(__file__).resolve().parent.parent
DATA = ML_DIR / "data" / "cv"
SEEDS = range(5)


def load_rows():
    rejected = {}
    for line in open(Path(__file__).with_name("rejected.txt"), encoding="utf-8"):
        if ":" in line and not line.startswith("#"):
            cls, ids = line.split(":")
            rejected[cls.strip()] = set(ids.split())
    rows = list(csv.DictReader(open(DATA / "manifest.csv", encoding="utf-8")))
    return [r for r in rows if Path(r["file"]).stem not in rejected.get(r["class"], set())]


def train_head(X: np.ndarray, y: np.ndarray, epochs: int = 300, wd: float = 1e-3) -> dict:
    torch.manual_seed(0)
    Xt, yt = torch.tensor(X, dtype=torch.float32), torch.tensor(y)
    lin = torch.nn.Linear(X.shape[1], len(CLASSES))
    counts = np.bincount(y, minlength=len(CLASSES)).astype(float)
    weight = torch.tensor(counts.sum() / np.maximum(counts, 1) / len(CLASSES), dtype=torch.float32)
    opt = torch.optim.Adam(lin.parameters(), lr=1e-2, weight_decay=wd)
    for _ in range(epochs):
        opt.zero_grad()
        loss = torch.nn.functional.cross_entropy(lin(Xt * 10), yt, weight=weight)
        loss.backward()
        opt.step()
    return {"W": (lin.weight.detach().numpy().T * 10), "b": lin.bias.detach().numpy()}


def split(y: np.ndarray, seed: int):
    rng = np.random.default_rng(seed)
    train, test = [], []
    for c in np.unique(y):
        idx = rng.permutation(np.flatnonzero(y == c))
        half = len(idx) // 2
        train += idx[:half].tolist()
        test += idx[half:].tolist()
    return np.array(train), np.array(test)


def main():
    rows = load_rows()
    y = np.array([CLASSES.index(r["class"]) for r in rows])
    an = Analyzer.load()
    an.head = None
    embs = []
    for i in range(0, len(rows), 16):
        embs.append(an.embed([Image.open(DATA / r["file"]) for r in rows[i:i + 16]]))
    E = torch.cat(embs)
    X = E.numpy()
    zs_pred = an.zero_shot_probs(E).argmax(-1)

    res = {"zero_shot": [], "linear_head": [], "infra_vs_not_head": []}
    confusion = np.zeros((len(CLASSES), len(CLASSES)), dtype=int)
    for seed in SEEDS:
        tr, te = split(y, seed)
        head = train_head(X[tr], y[tr])
        an.head = head
        pred = an.head_probs(E[te]).argmax(-1)
        an.head = None
        res["zero_shot"].append(float((zs_pred[te] == y[te]).mean()))
        res["linear_head"].append(float((pred == y[te]).mean()))
        bukan = CLASSES.index("bukan")
        res["infra_vs_not_head"].append(float(((pred == bukan) == (y[te] == bukan)).mean()))
        for t, p in zip(y[te], pred):
            confusion[t, p] += 1

    summary = {k: {"mean": round(float(np.mean(v)), 3), "std": round(float(np.std(v)), 3)} for k, v in res.items()}
    infra = y != CLASSES.index("bukan")
    out = {
        "n_images": int(len(rows)),
        "per_class": {c: int((y == i).sum()) for i, c in enumerate(CLASSES)},
        "protocol": "5 stratified 50/50 splits, accuracy on the held-out half",
        "accuracy": summary,
        "zero_shot_infra_only": round(float((zs_pred[infra] == y[infra]).mean()), 3),
        "confusion_head_summed_over_splits": {"labels": CLASSES, "matrix": confusion.tolist()},
    }
    HEAD_PATH.parent.mkdir(parents=True, exist_ok=True)
    use_head = summary["linear_head"]["mean"] > summary["zero_shot"]["mean"]
    out["deployed"] = "linear_head" if use_head else "zero_shot"
    out["version"] = "clip-b32-laion+" + ("linear-head-v1" if use_head else "zeroshot-v1")
    if use_head:
        np.savez(HEAD_PATH, **train_head(X, y))
    elif HEAD_PATH.exists():
        HEAD_PATH.unlink()
    (HEAD_PATH.parent / "eval.json").write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
