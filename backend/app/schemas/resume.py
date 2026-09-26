from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class ExperienceItem(BaseModel):
    company: str = ""
    title: str = ""
    location: Optional[str] = ""
    dates: str = ""
    bullets: List[str] = []
    technologies: List[str] = []

class ProjectItem(BaseModel):
    name: str = ""
    description: str = ""
    bullets: List[str] = []
    technologies: List[str] = []
    url: Optional[str] = None

class EducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    dates: str = ""
    gpa_or_honors: Optional[str] = None

class CertificationItem(BaseModel):
    name: str = ""
    issuer: str = ""
    date: Optional[str] = None

class StructuredResume(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    summary: str = ""
    skills: List[str] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    education: List[EducationItem] = []
    certifications: List[CertificationItem] = []
    achievements: List[str] = []

class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    file_type: str
    is_default: bool
    parsed_json: StructuredResume
    created_at: datetime

class ResumeListResponse(BaseModel):
    resumes: List[ResumeResponse]
