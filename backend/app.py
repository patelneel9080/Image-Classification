import io
import os
from functools import lru_cache
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(__file__).resolve().parent / "best_cifar10_model.keras"
SITE_PATH = ROOT / "site"
CLASS_NAMES = [
    "airplane", "automobile", "bird", "cat", "deer",
    "dog", "frog", "horse", "ship", "truck",
]
MAX_IMAGE_BYTES = 8 * 1024 * 1024
DEFAULT_ORIGINS = "http://localhost:8000,http://127.0.0.1:8000"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("PROJECT_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI(title="CIFAR-10 Vision Lab API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.is_file():
        raise HTTPException(
            status_code=503,
            detail=f"Trained model file is missing: {MODEL_PATH.name}",
        )
    try:
        import tensorflow as tf
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="TensorFlow is not installed. Install backend/requirements.txt to enable predictions.",
        ) from exc
    return tf.keras.models.load_model(MODEL_PATH, compile=False)


@app.get("/api/health")
def health():
    try:
        load_model()
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"model_loaded": False, "message": exc.detail},
        )
    return {"model_loaded": True, "model": "Custom_CNN · CIFAR-10"}


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 8 MB upload limit.")
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        with Image.open(io.BytesIO(contents)) as source:
            source.verify()
        with Image.open(io.BytesIO(contents)) as source:
            image = source.convert("RGB").resize((32, 32), Image.Resampling.BILINEAR)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail="The upload could not be decoded as a supported image.",
        ) from exc

    batch = np.asarray(image, dtype=np.float32)[np.newaxis, ...] / 255.0
    model = load_model()
    probabilities = np.asarray(model.predict(batch, verbose=0))[0]
    if probabilities.shape != (len(CLASS_NAMES),) or not np.isfinite(probabilities).all():
        raise HTTPException(
            status_code=500,
            detail="The model returned an invalid prediction vector.",
        )

    order = np.argsort(probabilities)[::-1]
    winner = int(order[0])
    return {
        "predicted_class": CLASS_NAMES[winner],
        "confidence": float(probabilities[winner]),
        "scores": [
            {"class_name": CLASS_NAMES[int(index)], "score": float(probabilities[index])}
            for index in order
        ],
        "model": "Custom_CNN · best_cifar10_model.keras",
        "input_size": [32, 32],
        "preprocessing": "RGB, bilinear resize to 32×32, float32 / 255",
    }


app.mount("/", StaticFiles(directory=SITE_PATH, html=True), name="site")
