import os
import json
import base64
import logging
from datetime import timedelta

import httpx
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)
load_dotenv(override=True)

app = FastAPI(
    title="Premium AI Studio API",
    description="Generates YouTube thumbnails with intelligent text extraction and user accounts.",
    version="4.0.0",
    debug=True
)
@app.get("/")
def root():
    return {"message": "AI Studio API running"}

@app.get("/api")
def api_test():
    return {"status": "API working"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hf_token = os.getenv("HF_TOKEN")
openai_api_key = os.getenv("OPENAI_API_KEY")

HF_API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"

class GenerateRequest(BaseModel):
    title: str
    style: str

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/profile/thumbnails", response_model=list[schemas.ThumbnailResponse])
def get_user_thumbnails(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    thumbnails = db.query(models.Thumbnail).filter(models.Thumbnail.user_id == current_user.id).order_by(models.Thumbnail.created_at.desc()).all()
    return thumbnails

def extract_keywords_heuristic(title: str) -> dict:
    words = title.strip().split()
    if not words:
        return {"short_title": "NEW VIDEO", "highlight_word": "EPIC"}
    
    stopwords = {"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "about", "by", "is", "are", "was", "were", "of", "how", "why", "what", "when", "where", "who"}
    
    meaningful_words = [w for w in words if w.lower() not in stopwords and len(w) > 2]
    
    if meaningful_words:
        highlight = max(meaningful_words, key=len)
    else:
        highlight = words[-1]
        
    short_title_words = [w for w in words if w != highlight][:3]
    short_title = " ".join(short_title_words)
    if not short_title:
        short_title = "CHECK THIS"
        
    return {
        "short_title": short_title.upper(),
        "highlight_word": highlight.upper()
    }

async def extract_title_keywords(title: str) -> dict:
    if openai_api_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": "You are a YouTube CTR expert. Analyze the video title and return a JSON object with two keys: `short_title` (a concise, punchy version of the title, max 4 words) and `highlight_word` (the single most emotional, click-worthy, or important keyword). DO NOT wrap in markdown."},
                            {"role": "user", "content": f"Title: {title}"}
                        ],
                        "temperature": 0.7
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    result = json.loads(content)
                    return {
                        "short_title": result.get("short_title", "").upper(),
                        "highlight_word": result.get("highlight_word", "").upper()
                    }
        except Exception as e:
            logging.error(f"OpenAI extraction failed: {e}. Falling back to heuristic.")
            
    return extract_keywords_heuristic(title)

def enhance_prompt(title: str, style: str) -> str:
    return (
        f"A highly vibrant, high-contrast, professional YouTube thumbnail background. "
        f"Subject matter relates to: {title}. Style: {style}. 3D elements, vivid lighting, "
        f"expressive colors to maximize views. Empty space in the foreground for text. "
        f"ABSOLUTELY NO TEXT OR LETTERS IN THE IMAGE."
    )

@app.post("/api/generate")
async def generate_thumbnail(
    req: GenerateRequest, 
    current_user: models.User = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    token = hf_token or os.getenv("HF_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="Hugging Face token is missing")
        
    title = req.title.strip()
    style = req.style.strip()
    
    if not title or not style:
        raise HTTPException(status_code=400, detail="Title and style must not be empty.")
        
    text_data = await extract_title_keywords(title)
    short_title = text_data["short_title"]
    highlight_word = text_data["highlight_word"]
    
    detailed_prompt = enhance_prompt(title, style)
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": detailed_prompt}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(HF_API_URL, headers=headers, json=payload, timeout=60.0)
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"HF API Error: {response.text}")
            
        image_bytes = response.content
        base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{base64_encoded}"
        
        if current_user:
            db_thumb = models.Thumbnail(
                user_id=current_user.id,
                image_url=image_url,
                short_title=short_title,
                highlight_word=highlight_word
            )
            db.add(db_thumb)
            db.commit()
            db.refresh(db_thumb)
        
        return {
            "success": True,
            "image_url": image_url,
            "short_title": short_title,
            "highlight_word": highlight_word
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
