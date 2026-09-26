import uuid
import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.schemas.optimization import SuggestionItem
from app.ai.base import AIProvider
from app.ai.factory import get_ai_provider
from app.ai.prompts import CV_OPTIMIZER_SYSTEM

logger = logging.getLogger(__name__)


def clean_optimized_text(text: str) -> str:
    """Strips any unwanted labels like BEFORE:, AFTER:, REASON:, markdown headers or surrounding quotes."""
    if not text:
        return text
    cleaned = text.strip()

    for tag in ["**AFTER:**", "**AFTER**:", "AFTER:"]:
        if tag in cleaned:
            parts = cleaned.split(tag, 1)
            after_part = parts[1].strip()
            for r_tag in ["**REASON:**", "**REASON**:", "REASON:"]:
                if r_tag in after_part:
                    after_part = after_part.split(r_tag, 1)[0].strip()
            cleaned = after_part
            break

    # If BEFORE is still present at start
    if "**BEFORE:**" in cleaned or "BEFORE:" in cleaned:
        for b_tag in ["**BEFORE:**", "BEFORE:"]:
            if b_tag in cleaned:
                cleaned = cleaned.split(b_tag, 1)[0].strip()

    cleaned = cleaned.strip().strip('"').strip("'").strip()
    return cleaned

async def _optimize_summary_task(
    resume_summary: str,
    job: JobPostingSchema,
    matched_skills: List[str],
    underrepresented_skills: List[str],
    missing_skills: List[str],
    ai_provider: Optional[AIProvider] = None
) -> SuggestionItem | None:
    target_phrases = ", ".join(matched_skills[:4] + underrepresented_skills[:2])
    prompt = (
        f"Candidate Original Summary:\n\"{resume_summary}\"\n\n"
        f"Target Job Title: {job.title}\n"
        f"Target Company: {job.company}\n"
        f"Verified Skills to emphasize: {target_phrases}\n"
        f"MISSING SKILLS (DO NOT INCLUDE OR MENTION): {', '.join(missing_skills)}\n\n"
        "Rewrite the summary to better align with the job description while staying strictly factual based on original evidence."
    )
    provider = ai_provider or get_ai_provider()
    try:
        optimized = await provider.generate_text(prompt, system_prompt=CV_OPTIMIZER_SYSTEM)
        optimized = clean_optimized_text(optimized)
        
        for missing_sk in missing_skills:
            if len(missing_sk) > 3 and missing_sk.lower() in optimized.lower():
                return None

        if optimized and optimized != resume_summary:
            return SuggestionItem(
                id=str(uuid.uuid4()),
                section="summary",
                before_text=resume_summary,
                after_text=optimized,
                reason=f"Aligns professional summary with '{job.title}' role requirements using existing background evidence."
            )
    except Exception as e:
        logger.warning(f"Failed to generate summary optimization: {e}")
    return None

async def _optimize_bullet_task(
    orig_bullet: str,
    job: JobPostingSchema,
    company: str,
    title: str,
    technologies: List[str],
    missing_skills: List[str],
    section_key: str,
    ai_provider: Optional[AIProvider] = None
) -> SuggestionItem | None:
    bullet_prompt = (
        f"Original Bullet Point:\n\"{orig_bullet}\"\n\n"
        f"Target Job Title: {job.title}\n"
        f"Role context: {title} at {company}\n"
        f"Candidate's Verified Tools in this role: {', '.join(technologies)}\n"
        f"DO NOT INVENT METRICS OR UNMENTIONED TOOLS.\n\n"
        "Enhance this bullet point with stronger action verbs and impact phrasing."
    )
    provider = ai_provider or get_ai_provider()
    try:
        enhanced = await provider.generate_text(bullet_prompt, system_prompt=CV_OPTIMIZER_SYSTEM)
        enhanced = clean_optimized_text(enhanced)
        
        for missing_sk in missing_skills:
            if len(missing_sk) > 3 and missing_sk.lower() in enhanced.lower():
                return None

        if enhanced and enhanced != orig_bullet:
            return SuggestionItem(
                id=str(uuid.uuid4()),
                section=section_key,
                before_text=orig_bullet,
                after_text=enhanced,
                reason=f"Enhances responsibility statement for '{title}' at {company} with strong action verbs and technical impact."
            )
    except Exception as e:
        logger.warning(f"Failed to optimize bullet: {e}")
    return None

async def generate_optimization_suggestions(
    resume: StructuredResume,
    job: JobPostingSchema,
    matched_skills: List[str],
    underrepresented_skills: List[str],
    missing_skills: List[str],
    ai_provider: Optional[AIProvider] = None
) -> List[SuggestionItem]:

    
    tasks = []

    # 1. Summary Optimization Task
    if resume.summary:
        tasks.append(_optimize_summary_task(
            resume.summary, job, matched_skills, underrepresented_skills, missing_skills, ai_provider=ai_provider
        ))

    # 2. Experience Bullets Optimization Tasks
    if resume.experience:
        for exp_idx, exp in enumerate(resume.experience):
            for bullet_idx, orig_bullet in enumerate(exp.bullets):
                section_key = f"experience:{exp_idx}:{bullet_idx}"
                tasks.append(_optimize_bullet_task(
                    orig_bullet=orig_bullet,
                    job=job,
                    company=exp.company,
                    title=exp.title,
                    technologies=exp.technologies,
                    missing_skills=missing_skills,
                    section_key=section_key,
                    ai_provider=ai_provider
                ))

    # 3. Projects Optimization Tasks
    if resume.projects:
        for proj_idx, proj in enumerate(resume.projects):
            for bullet_idx, orig_bullet in enumerate(proj.bullets):
                section_key = f"project:{proj_idx}:{bullet_idx}"
                tasks.append(_optimize_bullet_task(
                    orig_bullet=orig_bullet,
                    job=job,
                    company=proj.name,
                    title="Project",
                    technologies=proj.technologies,
                    missing_skills=missing_skills,
                    section_key=section_key,
                    ai_provider=ai_provider
                ))

    # Run AI tasks concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)

    suggestions: List[SuggestionItem] = []
    for res in results:
        if isinstance(res, SuggestionItem):
            suggestions.append(res)
        elif isinstance(res, Exception):
            logger.warning(f"Error in optimization task: {res}")

    # 4. Underrepresented Skills Highlight Suggestions
    for skill_to_highlight in underrepresented_skills[:3]:
        if skill_to_highlight not in resume.skills:
            suggestions.append(SuggestionItem(
                id=str(uuid.uuid4()),
                section=f"skills:{skill_to_highlight}",
                before_text=f"Current Skills: {', '.join(resume.skills[:5])}...",
                after_text=skill_to_highlight,
                reason=f"Adds verified skill '{skill_to_highlight}' found in your experience/projects to the main skills section."
            ))

    return suggestions


def apply_suggestions_to_resume(
    original_resume: StructuredResume,
    suggestions: List[SuggestionItem],
    accepted_ids: List[str]
) -> StructuredResume:
    
    updated = original_resume.model_copy(deep=True)
    accepted_set = set(accepted_ids)
    
    for sug in suggestions:
        if sug.id not in accepted_set:
            continue
        
        clean_after = clean_optimized_text(sug.after_text)

        if sug.section == "summary":
            updated.summary = clean_after

        elif sug.section.startswith("experience:"):
            parts = sug.section.split(":")
            if len(parts) == 3:
                exp_idx, b_idx = int(parts[1]), int(parts[2])
                if 0 <= exp_idx < len(updated.experience):
                    if 0 <= b_idx < len(updated.experience[exp_idx].bullets):
                        updated.experience[exp_idx].bullets[b_idx] = clean_after

        elif sug.section.startswith("project:"):
            parts = sug.section.split(":")
            if len(parts) == 3:
                p_idx, b_idx = int(parts[1]), int(parts[2])
                if updated.projects and 0 <= p_idx < len(updated.projects):
                    if 0 <= b_idx < len(updated.projects[p_idx].bullets):
                        updated.projects[p_idx].bullets[b_idx] = clean_after

        elif sug.section == "skills" or sug.section.startswith("skills:"):
            new_skill = clean_after
            if "," in new_skill and "Skills List:" in new_skill:
                new_skill = new_skill.split(",")[-1].strip()
            if new_skill and new_skill not in updated.skills:
                updated.skills.append(new_skill)

        # Legacy fallback
        elif sug.section == "experience_bullet":
            clean_before = sug.before_text
            if "]" in clean_before:
                clean_before = clean_before.split("]", 1)[-1].strip()

            replaced = False
            for exp in updated.experience:
                for bi, b in enumerate(exp.bullets):
                    if b == clean_before or clean_before in b:
                        exp.bullets[bi] = clean_after
                        replaced = True
                        break
                if replaced:
                    break

    return updated


