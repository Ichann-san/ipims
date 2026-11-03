from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import random
from typing import List, Optional
import google.generativeai as genai
import io
import PIL.Image

app = FastAPI(title="IPIMS Backend API")

# Setup CORS to allow requests from the local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini (Replace with your actual API key)
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
genai.configure(api_key=GEMINI_API_KEY)

# Global in-memory reports list
REPORTS = []

class ReportResponse(BaseModel):
    report_id: str
    status: str
    ai_confidence: int
    message: str

class AnalyzeResponse(BaseModel):
    category: str
    description: str

class SimulationRequest(BaseModel):
    interventions: list[str]

class SimulationResponse(BaseModel):
    road_quality_index: int
    safety_score: int
    avg_response_hours: float
    efficiency: int
    cost_estimate: str
    duration_weeks: str
    message: str

@app.post("/api/analyze-photo", response_model=AnalyzeResponse)
async def analyze_photo(photo: UploadFile = File(...)):
    try:
        # Read the uploaded image
        image_bytes = await photo.read()
        img = PIL.Image.open(io.BytesIO(image_bytes))
        
        # Initialize Gemini 1.5 Flash Model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Customize prompt injection here
        prompt = (
            "Analyze this photo of public infrastructure damage. "
            "Output exactly two lines. "
            "Line 1 MUST be exactly one of these categories: Jalan, Trotoar, Drainase, Lampu Jalan, Halte, Jembatan, Lainnya. "
            "Line 2 MUST be a short 1 sentence description of the severity."
        )
        
        response = model.generate_content([prompt, img])
        
        # Parse the response
        lines = response.text.strip().split('\n')
        category = lines[0].strip() if len(lines) > 0 else "Lainnya"
        description = lines[1].strip() if len(lines) > 1 else "Unknown severity"
        
        # Ensure category is valid
        valid_cats = ["Jalan", "Trotoar", "Drainase", "Lampu Jalan", "Halte", "Jembatan", "Lainnya"]
        if category not in valid_cats:
            category = "Lainnya"
            
        return AnalyzeResponse(category=category, description=description)
        
    except Exception as e:
        print("Gemini API Error:", e)
        # Fallback if API key is not set or invalid
        return AnalyzeResponse(
            category="Jalan",
            description="[Mocked Analysis] Gemini API key not configured or failed."
        )

@app.post("/api/laporan", response_model=ReportResponse)
async def create_report(
    category: str = Form(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    manual_pin: bool = Form(False),
    photo: UploadFile = File(...)
):
    # Simulate processing delay
    time.sleep(1.0)
    
    # Generate a mock report ID
    report_id = f"#REP-{random.randint(1000, 9999)}"
    
    # AI Confidence based on manual pin
    confidence = 95 if not manual_pin else 100
    
    # Create the report record
    report_data = {
        "id": report_id,
        "category": category,
        "location": {"lat": latitude, "lng": longitude},
        "manual_pin": manual_pin,
        "photo_filename": photo.filename,
        "status": "baru",
        "timestamp": time.time()
    }
    
    REPORTS.append(report_data)
    
    return ReportResponse(
        report_id=report_id,
        status="Success",
        ai_confidence=confidence,
        message="Report processed successfully."
    )

@app.get("/api/laporan")
def get_reports():
    return {"reports": REPORTS}

@app.post("/api/simulasi", response_model=SimulationResponse)
async def run_simulation(req: SimulationRequest):
    time.sleep(1.2)
    if not req.interventions:
        raise HTTPException(status_code=400, detail="No interventions provided")
    
    road_quality_index = -18
    safety_score = 22
    avg_response_hours = 2.1
    efficiency = 94
    cost = "Rp 8.4M"
    duration = "3-4 Minggu"
    
    if "jalan" in req.interventions[0].lower():
        road_quality_index += 30
        safety_score += 15
        cost = "Rp 15.2M"
    if "drainase" in req.interventions[0].lower():
        road_quality_index += 5
        safety_score += 10
        cost = "Rp 9.5M"
    
    return SimulationResponse(
        road_quality_index=road_quality_index,
        safety_score=safety_score,
        avg_response_hours=avg_response_hours,
        efficiency=efficiency,
        cost_estimate=cost,
        duration_weeks=duration,
        message="Simulation completed successfully"
    )

@app.get("/")
def read_root():
    return {"message": "IPIMS Backend API is running."}
