import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class UserModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ResumeModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    filename: str
    file_type: str
    file_path: str
    raw_text: str
    parsed_json: Dict[str, Any]
    is_default: bool = False
    file_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class JobPostingModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    url: Optional[str] = None
    title: str
    company: Optional[str] = None
    raw_text: str
    extracted_json: Dict[str, Any]
    content_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class JobAnalysisModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    resume_id: str
    job_posting_id: str
    overall_score: float
    score_breakdown: Dict[str, Any]
    matched_skills: List[str]
    underrepresented_skills: List[str]
    missing_skills: List[str]
    evidence_list: List[Dict[str, Any]]
    ats_analysis: Dict[str, Any]
    created_at: datetime = Field(default_factory=utc_now)

class OptimizationSuggestionModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    analysis_id: str
    section: str
    before_text: str
    after_text: str
    reason: str
    status: str = "pending"

class CoverLetterModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    analysis_id: str
    user_id: str
    content: str
    version: int = 1
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class GeneratedDocumentModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    analysis_id: str
    doc_type: str
    file_path: str
    created_at: datetime = Field(default_factory=utc_now)
