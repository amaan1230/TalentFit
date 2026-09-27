import json
import logging
from typing import Type, TypeVar
from pydantic import BaseModel
from app.ai.base import AIProvider
from app.schemas.resume import StructuredResume, ExperienceItem, ProjectItem, EducationItem
from app.schemas.job import JobPostingSchema

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)

class MockProvider(AIProvider):
    async def generate_text(self, prompt: str, system_prompt: str = None) -> str:
        if "cover letter" in prompt.lower() or "cover letter" in (system_prompt or "").lower():
            return (
                "Dear Hiring Manager,\n\n"
                "I am writing to express my strong interest in the open position at your esteemed company. "
                "With my extensive background in developing robust web applications, optimizing data pipelines, "
                "and delivering high-impact solutions, I am confident in my ability to immediately contribute to your team's success.\n\n"
                "Throughout my career, I have consistently demonstrated a track record of translating complex requirements "
                "into elegant technical architectures. My hands-on experience aligns closely with your team's core technical stack.\n\n"
                "Thank you for considering my application. I welcome the opportunity to discuss how my skill set and background "
                "align with your needs.\n\n"
                "Sincerely,\nCandidate"
            )
        return "Generated response based on provided input."

    async def generate_structured(self, prompt: str, schema_cls: Type[T], system_prompt: str = None) -> T:
        schema_name = schema_cls.__name__
        
        if schema_name == "StructuredResume":
            # Extract real content dynamically from the uploaded document text prompt
            clean_prompt = prompt.replace("Parse the following resume content into structured format:\n\n", "")
            lines = [l.strip() for l in clean_prompt.split('\n') if l.strip()]
            candidate_name = lines[0] if lines else "Candidate"
            
            # Extract basic skills from document text
            text_lower = clean_prompt.lower()
            skill_keywords = ["python", "javascript", "typescript", "react", "next.js", "node.js", "html", "css", "tailwind", "sql", "postgresql", "mongodb", "fastapi", "django", "flask", "aws", "docker", "git", "java", "c++", "c#", "figma", "rest apis", "rest api", "machine learning", "data analysis", "project management"]
            found_skills = [s.title() for s in skill_keywords if s in text_lower]
            if not found_skills:
                found_skills = ["Extracted Document Content"]

            data = StructuredResume(
                name=candidate_name if len(candidate_name) < 40 else "Candidate Profile",
                email="",
                phone="",
                location="",
                summary=clean_prompt[:400].strip(),
                skills=found_skills,
                experience=[],
                projects=[],
                education=[],
                certifications=[],
                achievements=[]
            )
            return data # type: ignore

        elif schema_name == "JobPostingSchema":
            data = JobPostingSchema(
                title="Senior AI Full Stack Engineer",
                company="Nexus AI Corp",
                location="Remote / San Francisco",
                employment_type="Full-time",
                experience="4+ years",
                education="BS in CS or related field",
                required_skills=["Python", "FastAPI", "React", "TypeScript", "Next.js", "PostgreSQL"],
                preferred_skills=["Docker", "Generative AI", "LangChain", "Vector Databases", "AWS"],
                technologies=["Python", "FastAPI", "Next.js", "PostgreSQL", "Docker", "AWS"],
                responsibilities=[
                    "Design and implement scalable AI-powered web applications.",
                    "Build clean backend REST APIs in Python FastAPI.",
                    "Craft intuitive React user interfaces with modern styling.",
                    "Collaborate with product and AI teams to deliver production features."
                ],
                certifications=[],
                soft_skills=["Communication", "Problem-solving", "Team leadership"],
                keywords=["Python", "FastAPI", "React", "TypeScript", "Next.js", "PostgreSQL", "Generative AI", "AWS", "Docker"]
            )
            return data # type: ignore

        # Default fallback: create empty instance if possible
        try:
            return schema_cls()
        except Exception:
            raise ValueError(f"MockProvider does not have a default mock handler for {schema_name}")
