from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo import MongoClient
from bson.objectid import ObjectId
import pytesseract
from PIL import Image
import io
import fitz  # PyMuPDF
import re
from datetime import datetime
from dotenv import load_dotenv
import os

# Load env vars
load_dotenv()

# Use env vars
MONGO_URI = os.getenv("MONGO_URI")
TESSERACT_PATH = os.getenv("TESSERACT_PATH")

# Path to Tesseract OCR executable
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

# MongoDB Compass connection
client = MongoClient(MONGO_URI)
db = client["test"]
leads_collection = db["leads"]

# OCR class
class OCR:
    def image_to_string(self, pdf_bytes: bytes) -> str:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            pix = page.get_pixmap()
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(img)
            full_text += text + "\n"
        print(full_text)
        return full_text

ocr_engine = OCR()

# FastAPI app initialization
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Use specific domain in production.
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for manual form lead submission
class LeadModel(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    status: str
    source: str
    createdAt: datetime

# Utility: Extract name, email, phone using regex
def extract_info(text: str):
    name_match = re.findall(r"(?:Name[:\s]*)([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", text)
    email_match = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    phone_match = re.findall(r"\+?\d[\d\s\-()]{7,}", text)

    print(name_match)
    print(email_match)
    print(phone_match)

    return {
        "name": name_match[0] if name_match else "",
        "email": email_match[0] if email_match else "",
        "phone": phone_match[0] if phone_match else "",
    }

# ---------- API Routes ---------- #

@app.post("/extract-lead")
async def extract_lead(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return {"error": "Only PDF files are supported."}

    contents = await file.read()
    text = ocr_engine.image_to_string(contents)
    extracted = extract_info(text)

    lead = {
        "id": str(datetime.utcnow().timestamp()),
        "name": extracted["name"],
        "email": extracted["email"],
        "phone": extracted["phone"],
        "status": "New",
        "source": "Document",
        "createdAt": datetime.utcnow()
    }

    result = leads_collection.insert_one(lead)
    lead["_id"] = str(result.inserted_id)

    return lead

@app.post("/leads")
async def create_lead(lead: LeadModel):
    lead_dict = lead.dict()
    result = leads_collection.insert_one(lead_dict)
    lead_dict["_id"] = str(result.inserted_id)
    return lead_dict

@app.get("/leads")
def get_leads():
    leads = []
    for lead in leads_collection.find():
        lead["_id"] = str(lead["_id"])
        lead["id"] = lead["_id"]
        leads.append(lead)
    return leads  # <- Don't forget this!



@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: str):
    try:
        result = leads_collection.delete_one({"_id": ObjectId(lead_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")

    return JSONResponse(content={"message": "Lead deleted successfully"})

@app.put("/leads/{lead_id}")
async def update_lead_status(lead_id: str, updates: dict = Body(...)):
    try:
        result = leads_collection.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": updates}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")

    return {"message": "Lead updated successfully"}