from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ThumbnailResponse(BaseModel):
    id: int
    image_url: str
    short_title: str
    highlight_word: str
    created_at: datetime

    class Config:
        from_attributes = True
