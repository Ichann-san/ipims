# CV evaluation — category classification

Measured 2026-11-03 with `python -m ml.cv.evaluate`. Numbers are copied from `ml/artifacts/cv/eval.json`.

## Model

- Vision transformer: `laion/CLIP-ViT-B-32-laion2B-s34B-b79K` (MIT licence), loaded from safetensors only.
- Category: zero-shot prompts per class (`ml/cv/infer.py`, written before evaluation, not tuned on the test images).
- Damage type (roads) and severity: zero-shot prompts within the predicted category. **Not evaluated** — no labelled severity data exists for these categories yet.
- A linear head on CLIP embeddings is trained too, but is deployed only if it beats zero-shot. Tonight it did not.

## Data

157 freely licensed Wikimedia Commons images collected by `ml.cv.collect` from search queries, then every image checked by eye on contact sheets; wrong or ambiguous images are listed in `ml/cv/rejected.txt`. Licence and author of every image are in `ml/data/cv/manifest.csv` (not committed).

| jalan | trotoar | drainase | lampu_jalan | halte | jembatan | bukan (not infrastructure) |
|---|---|---|---|---|---|---|
| 21 | 15 | 10 | 19 | 16 | 20 | 56 |

## Results (5 stratified 50/50 splits, accuracy on the held-out half)

| Method | Accuracy (7 classes) |
|---|---|
| Zero-shot CLIP (deployed) | **95.0% ± 1.8%** |
| Linear head on CLIP embeddings | 92.5% ± 1.4% |
| Infrastructure vs not (linear head) | 99.7% ± 0.5% |

Linear-head confusion matrix, summed over the five test halves (rows = true, columns = predicted):

| | jalan | trotoar | drainase | lampu | halte | jembatan | bukan |
|---|---|---|---|---|---|---|---|
| jalan | 53 | 2 | 0 | 0 | 0 | 0 | 0 |
| trotoar | 11 | 25 | 2 | 1 | 0 | 1 | 0 |
| drainase | 2 | 3 | 18 | 0 | 2 | 0 | 0 |
| lampu_jalan | 0 | 0 | 1 | 47 | 2 | 0 | 0 |
| halte | 0 | 0 | 0 | 1 | 39 | 0 | 0 |
| jembatan | 0 | 0 | 1 | 0 | 0 | 48 | 1 |
| bukan | 0 | 0 | 0 | 0 | 0 | 0 | 140 |

## Limits — read before quoting the number

- The proposal KPI (>85%, validated against field officers) is about real citizen photos from Kediri. These are Commons photos, mostly from other countries, and only 157 images. 95% here is a sanity check, not proof of the KPI.
- Trotoar is most often confused with jalan; drainase has only 10 images.
- Severity and damage type are unvalidated zero-shot outputs. The admin verifies every report (design §8).
- Next step: collect labelled photos from the pilot (admin corrections become labels), then re-run this script; the linear head will take over once it beats zero-shot.
