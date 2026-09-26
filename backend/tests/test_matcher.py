import pytest
from app.schemas.resume import StructuredResume, ExperienceItem, ProjectItem
from app.schemas.job import JobPostingSchema
from app.services.matcher import calculate_match_analysis, search_evidence_in_resume

def test_evidence_hallucination_guard():
    """
    MANDATORY ACCEPTANCE TEST:
    Candidate Resume has Python and FastAPI.
    Job requires Python, FastAPI, and AWS.
    Verify AWS is classified as MISSING with evidence=None.
    It MUST NOT be added to matched or underrepresented skills.
    """
    resume = StructuredResume(
        name="John Doe",
        summary="Backend developer specializing in Python and FastAPI microservices.",
        skills=["Python", "FastAPI", "PostgreSQL"],
        experience=[
            ExperienceItem(
                company="DataTech",
                title="Python Developer",
                dates="2021-Present",
                bullets=["Built REST APIs using FastAPI."],
                technologies=["Python", "FastAPI"]
            )
        ]
    )

    job = JobPostingSchema(
        title="Backend Engineer",
        company="CloudCorp",
        required_skills=["Python", "FastAPI", "AWS"],
        keywords=["Python", "FastAPI", "AWS"]
    )

    analysis = calculate_match_analysis(resume, job)

    assert "Python" in analysis["matched_skills"]
    assert "FastAPI" in analysis["matched_skills"]
    assert "AWS" in analysis["missing_skills"]
    assert "AWS" not in analysis["matched_skills"]
    assert "AWS" not in analysis["underrepresented_skills"]

    # Check evidence details for AWS
    aws_evidence = next(e for e in analysis["evidence_list"] if e["keyword"] == "AWS")
    assert aws_evidence["status"] == "missing"
    assert aws_evidence["evidence"] is None

def test_synonym_and_underrepresented_matching():
    resume = StructuredResume(
        name="Jane Developer",
        summary="Building Generative AI apps with LangChain and vector databases.",
        skills=["Python", "TypeScript", "LangChain"],
        experience=[
            ExperienceItem(
                company="AI Startup",
                title="AI Engineer",
                dates="2022-Present",
                bullets=["Developed LLM powered RAG pipeline using Gemini API."],
                technologies=["Python", "LLM", "RAG"]
            )
        ]
    )

    job = JobPostingSchema(
        title="Generative AI Engineer",
        company="NextGen",
        required_skills=["Python", "Generative AI", "React"],
        keywords=["Generative AI", "Python", "React"]
    )

    analysis = calculate_match_analysis(resume, job)
    
    assert "Python" in analysis["matched_skills"]
    # Generative AI should be matched or underrepresented due to LLM/RAG/LangChain evidence
    assert ("Generative AI" in analysis["matched_skills"] or "Generative AI" in analysis["underrepresented_skills"])
    assert "React" in analysis["missing_skills"]

def test_deterministic_score_calculation():
    resume = StructuredResume(
        name="Alex",
        summary="Senior Engineer",
        skills=["Python", "FastAPI", "React", "Docker"],
        experience=[
            ExperienceItem(company="A", title="Dev", dates="2020-2022", bullets=["Bullet 1"], technologies=["Python"]),
            ExperienceItem(company="B", title="Senior Dev", dates="2022-2024", bullets=["Bullet 2"], technologies=["FastAPI"])
        ],
        projects=[
            ProjectItem(name="Project 1", description="Desc 1", bullets=["B1"])
        ],
        education=[
            {"institution": "State Univ", "degree": "BS", "field": "CS", "dates": "2016-2020"}
        ]
    )

    job = JobPostingSchema(
        title="Full Stack Engineer",
        required_skills=["Python", "FastAPI", "React", "Docker"],
        technologies=["Python", "FastAPI"]
    )

    analysis = calculate_match_analysis(resume, job)
    
    assert analysis["overall_score"] >= 85.0
    assert analysis["score_breakdown"]["skills"] == 100.0
    assert analysis["score_breakdown"]["education"] == 100.0
