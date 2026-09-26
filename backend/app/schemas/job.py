from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class JobPostingSchema(BaseModel):
    title: str = "Target Position"
    company: str = "Target Company"
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    technologies: List[str] = []
    responsibilities: List[str] = []
    certifications: List[str] = []
    soft_skills: List[str] = []
    keywords: List[str] = []

class JobExtractUrlRequest(BaseModel):
    url: str
    resume_id: str

class JobExtractTextRequest(BaseModel):
    raw_text: str
    resume_id: str
    title: Optional[str] = None
    company: Optional[str] = None

class JobPostingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: Optional[str] = None
    title: str
    company: Optional[str] = None
    extracted_json: JobPostingSchema
    created_at: datetime
