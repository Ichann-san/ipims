"""Infrastructure photo analysis with a CLIP vision transformer.

Category: linear head on CLIP image embeddings (trained by ml.cv.evaluate) or, if no head exists,
zero-shot prompts. Damage type and severity: zero-shot prompts within the predicted category.
Weights: laion/CLIP-ViT-B-32-laion2B-s34B-b79K (MIT), loaded from safetensors only.
"""
from pathlib import Path

import numpy as np
import torch
from PIL import Image

MODEL_ID = "laion/CLIP-ViT-B-32-laion2B-s34B-b79K"
HEAD_PATH = Path(__file__).resolve().parent.parent / "artifacts" / "cv" / "head.npz"

CLASSES = ["jalan", "trotoar", "drainase", "lampu_jalan", "halte", "jembatan", "bukan"]
CLASS_PROMPTS = {
    "jalan": ["a photo of a damaged asphalt road", "a photo of a pothole in a road", "a photo of a cracked road surface"],
    "trotoar": ["a photo of a damaged sidewalk", "a photo of a broken pedestrian pavement", "a photo of a sidewalk"],
    "drainase": ["a photo of a drainage ditch", "a photo of a clogged street drain", "a photo of a roadside gutter"],
    "lampu_jalan": ["a photo of a street light", "a photo of a street lamp pole", "a photo of a broken street lamp"],
    "halte": ["a photo of a bus stop shelter", "a photo of a bus stop", "a photo of a public transport shelter"],
    "jembatan": ["a photo of a bridge", "a photo of a damaged bridge", "a photo of a small bridge over a river"],
    "bukan": ["a photo of an animal", "a photo of food", "a photo of a person", "a photo of flowers", "a photo of a painting"],
}
SUBJECT = {
    "jalan": "a road", "trotoar": "a sidewalk", "drainase": "a drainage channel", "lampu_jalan": "a street light",
    "halte": "a bus stop", "jembatan": "a bridge", "lainnya": "public infrastructure",
}
SEVERITY_PROMPTS = ["a photo of {} in good condition", "a photo of {} with minor damage", "a photo of {} that is severely damaged or broken"]
ROAD_DAMAGE = {
    "pothole": "a photo of a road with a pothole",
    "alligator_crack": "a photo of a road with alligator cracking",
    "crack": "a photo of a road with a long crack",
    "none": "a photo of a road in good condition",
}


def severity_label(score: float) -> str:
    return "low" if score < 0.4 else "mid" if score < 0.7 else "high"


class Analyzer:
    def __init__(self, model, processor, head: dict | None):
        self.model, self.processor, self.head = model, processor, head
        self.model.eval()
        self._text_cache: dict[str, torch.Tensor] = {}
        self.class_text = torch.stack([self.text(p).mean(0) for p in (CLASS_PROMPTS[c] for c in CLASSES)])
        self.class_text = self.class_text / self.class_text.norm(dim=-1, keepdim=True)

    @classmethod
    def load(cls, model_path: str | Path | None = None) -> "Analyzer":
        from transformers import CLIPModel, CLIPProcessor

        source = str(model_path) if model_path is not None else MODEL_ID
        options = {"local_files_only": True} if model_path is not None else {}
        model = CLIPModel.from_pretrained(source, use_safetensors=True, **options)
        processor = CLIPProcessor.from_pretrained(source, **options)
        head = dict(np.load(HEAD_PATH)) if HEAD_PATH.exists() else None
        return cls(model, processor, head)

    @property
    def version(self) -> str:
        return "clip-b32-laion+" + ("linear-head-v1" if self.head is not None else "zeroshot-v1")

    @torch.no_grad()
    def text(self, prompts: list[str]) -> torch.Tensor:
        key = "\n".join(prompts)
        if key not in self._text_cache:
            inputs = self.processor(text=prompts, return_tensors="pt", padding=True)
            t = self.model.get_text_features(**inputs)
            t = t if isinstance(t, torch.Tensor) else t.pooler_output
            self._text_cache[key] = t / t.norm(dim=-1, keepdim=True)
        return self._text_cache[key]

    @torch.no_grad()
    def embed(self, images: list[Image.Image]) -> torch.Tensor:
        inputs = self.processor(images=[i.convert("RGB") for i in images], return_tensors="pt")
        e = self.model.get_image_features(**inputs)
        e = e if isinstance(e, torch.Tensor) else e.pooler_output
        return e / e.norm(dim=-1, keepdim=True)

    def zero_shot_probs(self, emb: torch.Tensor) -> np.ndarray:
        logits = 100.0 * emb @ self.class_text.T
        return logits.softmax(-1).numpy()

    def head_probs(self, emb: torch.Tensor) -> np.ndarray:
        logits = emb.numpy() @ self.head["W"] + self.head["b"]
        logits -= logits.max(-1, keepdims=True)
        p = np.exp(logits)
        return p / p.sum(-1, keepdims=True)

    def _choice(self, emb: torch.Tensor, prompts: list[str]) -> np.ndarray:
        return (100.0 * emb @ self.text(prompts).T).softmax(-1).numpy()[0]

    def analyze(self, image: Image.Image) -> dict:
        emb = self.embed([image])
        probs = (self.head_probs(emb) if self.head is not None else self.zero_shot_probs(emb))[0]
        is_infra = probs[CLASSES.index("bukan")] < 0.5
        infra = probs[:-1]
        cat_idx = int(infra.argmax())
        category = CLASSES[cat_idx]
        confidence = float(infra[cat_idx] / max(infra.sum(), 1e-9)) if is_infra else float(1 - probs[-1])

        subject = SUBJECT[category]
        sev = self._choice(emb, [p.format(subject) for p in SEVERITY_PROMPTS])
        severity_score = float(0.5 * sev[1] + 1.0 * sev[2])

        damage_type = None
        if category == "jalan":
            names = list(ROAD_DAMAGE)
            dt = self._choice(emb, list(ROAD_DAMAGE.values()))
            damage_type = names[int(dt.argmax())]
            if damage_type == "none":
                damage_type = None

        return {
            "category": category,
            "category_confidence": round(confidence, 3),
            "is_infrastructure": bool(is_infra),
            "damage_type": damage_type,
            "severity": severity_label(severity_score),
            "severity_score": round(severity_score, 3),
            "model_version": self.version,
        }
