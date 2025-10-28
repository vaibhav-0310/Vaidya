from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING
import onnxruntime as ort
import numpy as np
import json
import os
import logging
import traceback

# Keras / image bits
from tensorflow.keras.models import load_model
from PIL import Image, UnidentifiedImageError
import io

# ---------- Config & Globals ----------
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/diabetes_prediction")
PORT = int(os.getenv("PORT", "5000"))

app = FastAPI(title="Vaidya Model Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # set True only if you actually use cookies/sessions
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn.error")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(">>> %s %s", request.method, request.url.path)
    try:
        response = await call_next(request)
        logger.info("<<< %s %s", response.status_code, request.url.path)
        return response
    except Exception:
        tb = traceback.format_exc()
        logger.error("Unhandled error on %s %s:\n%s", request.method, request.url.path, tb)
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# ---------- Mongo ----------
client: MongoClient = None
db = None
predictions_col = None

# ---------- Diabetes (ONNX) ----------
MODELS_DIR = Path(__file__).parent / "models"
ONNX_MODEL_PATH = MODELS_DIR / "diabetes_model.onnx"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"

session: ort.InferenceSession = None
model_info = {}

class PredictIn(BaseModel):
    pregnancies: Optional[float] = 0
    glucose: float = Field(..., description="Required")
    bloodPressure: Optional[float] = 0
    skinThickness: Optional[float] = 0
    insulin: Optional[float] = 0
    bmi: float = Field(..., description="Required")
    diabetesPedigreeFunction: Optional[float] = 0
    age: float = Field(..., description="Required")

class PredictOut(BaseModel):
    prediction: int
    probability: float
    risk_level: str
    accuracy: Optional[float] = None

def scale_inputs(raw: List[float]) -> np.ndarray:
    means = np.array(model_info["scaler_mean"], dtype=np.float32)
    scales = np.array(model_info["scaler_scale"], dtype=np.float32)
    x = np.array(raw, dtype=np.float32)
    return (x - means) / scales

def run_inference(scaled_row: np.ndarray) -> (int, float):
    input_name = session.get_inputs()[0].name
    input_tensor = scaled_row.astype(np.float32)[None, :]  # (1, N)
    results = session.run(None, {input_name: input_tensor})

    out = np.array(results[0]).ravel()
    if out.size == 1:
        val = float(out[0])
        prob = 1.0 / (1.0 + np.exp(-val)) if val > 1 else max(0.0, min(1.0, val))
        pred = 1 if prob > 0.5 else 0
    elif out.size == 2:
        prob = float(out[1])  # [p0, p1]
        pred = 1 if prob > 0.5 else 0
    else:
        val = float(out[0])
        prob = 1.0 / (1.0 + np.exp(-val)) if val > 1 else max(0.0, min(1.0, val))
        pred = 1 if prob > 0.5 else 0
    return int(pred), float(prob)

def risk_bucket(p: float) -> str:
    return "High" if p > 0.7 else "Medium" if p > 0.3 else "Low"

# ---------- Image (Keras) ----------
KERAS_MODEL_PATH = MODELS_DIR / "model.h5"
_image_model = None
CLASS_NAMES = ["glioma", "meningioma", "no_tumor", "pituitary"]  # update if different

def get_image_model():
    global _image_model
    if _image_model is None:
        if not KERAS_MODEL_PATH.exists():
            raise FileNotFoundError(f"{KERAS_MODEL_PATH} not found")
        _image_model = load_model(str(KERAS_MODEL_PATH))
    return _image_model

def get_expected_size():
    m = get_image_model()
    ishape = m.input_shape
    if isinstance(ishape, list):
        ishape = ishape[0]
    if len(ishape) < 4 or ishape[1] is None or ishape[2] is None:
        raise RuntimeError(f"Unexpected model input shape: {ishape}")
    H, W = int(ishape[1]), int(ishape[2])
    return (H, W)

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    H, W = get_expected_size()
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((W, H))
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")

    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)  # (1, H, W, 3)

# ---------- Startup / Shutdown ----------
@app.on_event("startup")
def on_startup():
    global client, db, predictions_col, session, model_info

    # Mongo
    client = MongoClient(MONGODB_URI)
    try:
        default_db = client.get_default_database()
    except Exception:
        default_db = None
    db = default_db if default_db is not None else client["diabetes_prediction"]
    predictions_col = db["predictions"]
    predictions_col.create_index([("timestamp", DESCENDING)])

    # ONNX
    if not ONNX_MODEL_PATH.exists():
        raise RuntimeError(f"ONNX model not found at: {ONNX_MODEL_PATH}")
    if not MODEL_INFO_PATH.exists():
        raise RuntimeError(f"model_info.json not found at: {MODEL_INFO_PATH}")

    session = ort.InferenceSession(str(ONNX_MODEL_PATH))
    with open(MODEL_INFO_PATH, "r", encoding="utf-8") as f:
        model_info = json.load(f)

    # (Optional) preload image model once on startup to surface errors early
    try:
        get_image_model()
    except Exception as e:
        logger.warning(f"Keras model lazy-load failed at startup: {e}")

@app.on_event("shutdown")
def on_shutdown():
    if client:
        client.close()

# ---------- Routes: Diabetes (ONNX) ----------
@app.get("/api/health")
def health():
    return {
        "status": "OK",
        "onnx_model_loaded": session is not None,
        "features": model_info.get("feature_names", []),
    }

@app.post("/api/predict", response_model=PredictOut)
def api_predict(payload: PredictIn):
    raw = [
        payload.pregnancies or 0,
        payload.glucose,
        payload.bloodPressure or 0,
        payload.skinThickness or 0,
        payload.insulin or 0,
        payload.bmi,
        payload.diabetesPedigreeFunction or 0,
        payload.age,
    ]
    try:
        scaled = scale_inputs(raw)
        pred, prob = run_inference(scaled)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ONNX inference failed: {e}")

    doc = {
        "inputs": payload.dict(),
        "prediction": pred,
        "probability": prob,
        "timestamp": datetime.utcnow(),
    }
    try:
        predictions_col.insert_one(doc)
    except Exception:
        pass  # don't fail API if logging fails

    return {
        "prediction": pred,
        "probability": prob,
        "risk_level": risk_bucket(prob),
        "accuracy": model_info.get("accuracy"),
    }

@app.get("/api/predictions")
def get_predictions():
    try:
        cur = predictions_col.find({}, {"_id": False}).sort("timestamp", DESCENDING).limit(50)
        return list(cur)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch predictions: {e}")

# ---------- Routes: Image (Keras) ----------
@app.get("/model-info")
def image_model_info():
    m = get_image_model()
    return {
        "input_shape": str(m.input_shape),
        "output_shape": str(m.output_shape),
        "layers": len(m.layers),
        "class_names": CLASS_NAMES,
    }

@app.post("/predict")
async def image_predict(file: UploadFile = File(...)):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    x = preprocess_image(contents)

    try:
        m = get_image_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model load error: {e}")

    try:
        preds = m.predict(x)
        class_idx = int(np.argmax(preds, axis=1)[0])
        confidence = float(np.max(preds))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    label = CLASS_NAMES[class_idx] if CLASS_NAMES else str(class_idx)
    return {"class": label, "confidence": confidence}

# ---------- Entrypoint ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=PORT, reload=True)