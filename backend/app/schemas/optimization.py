from pydantic import BaseModel
from typing import List, Optional
from app.schemas.resume import StructuredResume

class SuggestionItem(BaseModel):
    id: str
    section: str # e.g. "summary", "experience_bullet", "skills"
    before_text: str
    after_text: str
    reason: str
    status: str = "pending" # "pending", "accepted", "rejected"

class SuggestionsResponse(BaseModel):
    analysis_id: str
    suggestions: List[SuggestionItem]

class ApplyChangesRequest(BaseModel):
    accepted_ids: List[str]
    rejected_ids: List[str]

class OptimizedResumeResponse(BaseModel):
    analysis_id: str
    optimized_resume: StructuredResume
    accepted_count: int
    rejected_count: int
    original_score: Optional[float] = None
    new_overall_score: Optional[float] = None

