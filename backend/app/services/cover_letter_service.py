import logging
import re
from typing import Optional
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.ai.base import AIProvider
from app.ai.factory import get_ai_provider
from app.ai.prompts import COVER_LETTER_SYSTEM

logger = logging.getLogger(__name__)

PLACEHOLDER_COMPANIES = {"", "company", "target company", "unknown", "n/a"}


def fill_placeholders(text: str, name: str, company: str, email: str = "", phone: str = "") -> str:
    """LLMs still leak '[Your Name]'-style slots; fill the ones we know, drop the rest."""
    # Order matters: "[Company Name]" contains "name", so company is checked first.
    known = {"company": company, "email": email, "phone": phone, "name": name}

    def sub(m):
        key = m.group(1).lower()
        return next((v for k, v in known.items() if k in key and v), "")

    text = re.sub(r"\[([^\]\n]{2,40})\]", sub, text)
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+\n", "\n", text)).strip()


async def generate_tailored_cover_letter(
    resume: StructuredResume,
    job: JobPostingSchema,
    matched_skills: list,
    custom_notes: str = None,
    ai_provider: Optional[AIProvider] = None,
    fallback_name: str = None
) -> str:
    provider = ai_provider or get_ai_provider()

    cand_name = (resume.name or "").strip() or fallback_name or "Candidate"
    company = "" if (job.company or "").strip().lower() in PLACEHOLDER_COMPANIES else job.company.strip()
    contact = " | ".join(p for p in [resume.email, resume.phone, resume.location] if p)
    cand_title = (resume.experience[0].title if resume.experience else "Software Professional")
    exp_summary = "\n".join([f"- {e.title} at {e.company}: {', '.join(e.bullets[:2])}" for e in resume.experience[:2]])
    proj_summary = "\n".join([f"- {p.name}: {p.description}" for p in resume.projects[:2]]) if resume.projects else "None"

    prompt = (
        f"Generate a professional, tailored cover letter for {cand_name} applying for the {job.title} position at {company or 'the hiring company'}.\n\n"
        f"Candidate full name (put at the top and use exactly in the sign-off): {cand_name}\n"
        f"Candidate contact line (put under the name at the top): {contact or 'None'}\n\n"
        f"Target Job Requirements:\n"
        f"- Title: {job.title}\n"
        f"- Company: {company or 'Not stated - say your company, never invent a name'}\n"
        f"- Required Skills: {', '.join(job.required_skills)}\n"
        f"- Key Responsibilities: {', '.join(job.responsibilities[:3]) if job.responsibilities else 'Core role duties'}\n\n"
        f"Candidate Verified Qualifications:\n"
        f"- Current/Recent Title: {cand_title}\n"
        f"- Matched Skills: {', '.join(matched_skills)}\n"
        f"- Experience Highlights:\n{exp_summary}\n"
        f"- Key Projects:\n{proj_summary}\n"
        f"- Additional Candidate Notes: {custom_notes or 'None'}\n\n"
        "Generate a complete, structured cover letter (4-5 paragraphs). Do not include placeholders like '[Date]' or '[Hiring Manager Name]' if missing; use professional standard openings like 'Dear Hiring Manager at " + (company or "your company") + "'. End with 'Sincerely,' followed by " + cand_name + "."
    )

    try:
        content = await provider.generate_text(prompt, system_prompt=COVER_LETTER_SYSTEM)
        return fill_placeholders(content, cand_name, company or "your company", resume.email or "", resume.phone or "")
    except Exception as e:
        logger.error(f"Failed to generate cover letter: {e}")
        return (
            f"Dear Hiring Team at {company or 'your company'},\n\n"
            f"I am writing to express my enthusiastic interest in the {job.title} role. "
            f"With a strong technical background in {', '.join(matched_skills[:4]) if matched_skills else 'software development'}, "
            f"I am eager to bring my problem-solving capabilities to your team.\n\n"
            f"In my previous roles, I have consistently delivered robust, user-centric software applications and backend systems. "
            f"My technical skill set directly aligns with your requirements for {job.title}.\n\n"
            f"Thank you for considering my application. I look forward to the possibility of speaking with you.\n\n"
            f"Sincerely,\n{cand_name}"
        )

async def refine_cover_letter(
    current_content: str,
    instruction: str,
    custom_instruction: str = None,
    ai_provider: Optional[AIProvider] = None
) -> str:
    provider = ai_provider or get_ai_provider()
    
    instruction_map = {
        "shorten": "Make this cover letter more concise, crisp, and direct while preserving core facts.",
        "professional": "Elevate the language tone to be more executive, polished, and compelling.",
        "technical": "Emphasize candidate technical achievements, project impact, and engineering precision.",
        "custom": custom_instruction or "Refine and polish the cover letter."
    }

    selected_inst = instruction_map.get(instruction, instruction_map["custom"])
    prompt = f"Original Cover Letter:\n\n{current_content}\n\nTask: {selected_inst}\n\nReturn the complete updated cover letter text."

    try:
        updated = await provider.generate_text(prompt, system_prompt=COVER_LETTER_SYSTEM)
        return updated.strip()
    except Exception as e:
        logger.error(f"Failed to refine cover letter: {e}")
        return current_content

