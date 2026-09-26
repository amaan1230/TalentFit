from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class EvidenceItem(BaseModel):
    keyword: str
    status: str # "matched", "underrepresented", "missing"
    evidence: Optional[str] = None # Original resume section/bullet evidence string
    confidence: float = 1.0
    suggestion: Optional[str] = None

class ScoreBreakdown(BaseModel):
    skills: float
    experience: float
    projects: float
    education: float
    keywords: float

class ATSAnalysis(BaseModel):
    ats_score: float
    checks: List[Dict[str, Any]] # e.g. [{"name": "Keyword Coverage", "passed": True, "detail": "..."}, ...]

class MatchAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    job_posting_id: str
    overall_score: float
    score_breakdown: ScoreBreakdown
    matched_skills: List[str]
    underrepresented_skills: List[str]
    missing_skills: List[str]
    evidence_list: List[EvidenceItem]
    ats_analysis: ATSAnalysis
    created_at: datetime
    job_title: str
    company: str
