from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class GenerateCoverLetterRequest(BaseModel):
    analysis_id: str
    custom_notes: Optional[str] = None

class ImproveCoverLetterRequest(BaseModel):
    cover_letter_id: str
    instruction: str # "shorten", "professional", "technical", "custom"
    custom_instruction: Optional[str] = None

class CoverLetterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_id: str
    content: str
    version: int
    created_at: datetime
