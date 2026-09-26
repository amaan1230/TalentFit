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
            data = StructuredResume(
                name="Amaan Developer",
                email="amaan@example.com",
                phone="+1 (555) 019-2831",
                location="San Francisco, CA",
                summary="Experienced Full Stack Software Engineer specializing in Python, FastAPI, React, Next.js, and AI-driven web services with a strong focus on scalable backend architecture.",
                skills=["Python", "FastAPI", "JavaScript", "TypeScript", "React", "Next.js", "PostgreSQL", "Docker", "Git", "REST APIs", "Tailwind CSS"],
                experience=[
                    ExperienceItem(
                        company="TechNova Solutions",
                        title="Senior Software Engineer",
                        location="San Francisco, CA",
                        dates="2022 - Present",
                        bullets=[
                            "Architected high-performance FastAPI microservices serving over 500k monthly active users.",
                            "Developed interactive real-time user dashboards with Next.js and TypeScript.",
                            "Optimized database queries in PostgreSQL, achieving a 45% latency reduction in search endpoints."
                        ],
                        technologies=["Python", "FastAPI", "TypeScript", "Next.js", "PostgreSQL"]
                    ),
                    ExperienceItem(
                        company="Innovate Labs",
                        title="Full Stack Developer",
                        location="San Jose, CA",
                        dates="2020 - 2022",
                        bullets=[
                            "Built responsive single-page web applications utilizing React and Tailwind CSS.",
                            "Implemented OAuth2 and JWT authentication flows across backend endpoints.",
                            "Containerized application deployments using Docker and docker-compose."
                        ],
                        technologies=["React", "Node.js", "Docker", "REST APIs"]
                    )
                ],
                projects=[
                    ProjectItem(
                        name="AI Job Matcher",
                        description="Built an intelligent application comparing candidate CVs with job postings using LLMs and deterministic scoring.",
                        bullets=[
                            "Integrated structured JSON extraction using FastAPI and Pydantic models.",
                            "Designed an explainable score breakdown for skills, experience, and ATS compliance."
                        ],
                        technologies=["Python", "FastAPI", "React", "OpenAI API"]
                    )
                ],
                education=[
                    EducationItem(
                        institution="University of California, Berkeley",
                        degree="Bachelor of Science",
                        field="Computer Science",
                        dates="2016 - 2020"
                    )
                ],
                certifications=[],
                achievements=["Published open-source library with 1k+ GitHub stars"]
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
