import re
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.schemas.matching import EvidenceItem, ScoreBreakdown, ATSAnalysis

SYNONYM_MAP = {
    "javascript": ["js", "ecmascript"],
    "typescript": ["ts"],
    "react": ["reactjs", "react.js"],
    "next.js": ["nextjs", "next"],
    "node.js": ["nodejs", "node"],
    "python": ["py"],
    "postgresql": ["postgres", "pgsql"],
    "mongodb": ["mongo"],
    "kubernetes": ["k8s"],
    "generative ai": ["genai", "llm", "llms", "large language models", "rag", "langchain"],
    "llm": ["large language model", "generative ai", "genai", "rag", "langchain", "gpt"],
    "rag": ["retrieval augmented generation", "vector db", "langchain", "llama-index"],
    "aws": ["amazon web services"],
    "gcp": ["google cloud", "google cloud platform"],
    "azure": ["microsoft azure"],
    "docker": ["containers", "containerization"],
    "fastapi": ["fast api", "python api"],
    "ci/cd": ["cicd", "continuous integration", "github actions"],
    "rest api": ["restful api", "restful", "rest"],
}

ACTION_VERBS = {
    "engineered", "developed", "built", "designed", "implemented",
    "optimized", "enhanced", "spearheaded", "created", "architected",
    "managed", "led", "reduced", "increased", "delivered", "automated",
    "orchestrated", "deployed", "scaled", "improved", "formulated"
}

GENERIC_FLUFF_KEYWORDS = {
    "team", "work", "role", "environment", "fast-paced", "deliverables", "cross-functional",
    "stakeholders", "innovative", "production", "best practices", "quality", "experience",
    "written", "verbal", "communication", "skills", "ability", "strong", "understanding",
    "knowledge", "collaboration", "solutions", "impact", "results", "growth", "culture",
    "system", "systems", "practices", "responsibilities"
}

def normalize_term(term: str) -> str:
    cleaned = re.sub(r"[^\w\s\.\+#-]", "", term.lower().strip())
    return cleaned

def terms_are_synonyms(t1: str, t2: str) -> bool:
    n1, n2 = normalize_term(t1), normalize_term(t2)
    if not n1 or not n2:
        return False
    if n1 == n2:
        return True
    
    # Substring match if long enough
    if len(n1) > 3 and len(n2) > 3 and (n1 in n2 or n2 in n1):
        return True

    for canon, syns in SYNONYM_MAP.items():
        all_terms = [canon] + syns
        if any(normalize_term(t) == n1 for t in all_terms) and any(normalize_term(t) == n2 for t in all_terms):
            return True
    return False

def check_title_alignment(job_title: str, resume: StructuredResume) -> bool:
    if not job_title:
        return True
    
    stopwords = {"senior", "junior", "lead", "staff", "principal", "associate", "role", "-", "/", "&", "and", "or", "the", "a"}
    raw_words = re.findall(r"\w+", job_title.lower())
    target_keywords = set([w for w in raw_words if w not in stopwords and len(w) >= 2])
    
    if not target_keywords:
        return True

    text_corpus = (resume.summary or "").lower()
    for exp in resume.experience:
        text_corpus += " " + exp.title.lower() + " " + exp.company.lower()
    if resume.projects:
        for proj in resume.projects:
            text_corpus += " " + proj.name.lower()

    corpus_words = set(re.findall(r"\w+", text_corpus))
    matched_words = target_keywords.intersection(corpus_words)
    return len(matched_words) >= max(1, int(len(target_keywords) * 0.6))

def clean_required_reqs(job: JobPostingSchema) -> List[str]:
    primary = set([r for r in (job.required_skills + job.technologies) if r.strip()])
    
    filtered_keywords = set()
    for kw in job.keywords:
        norm = kw.lower().strip()
        if len(norm) > 2 and norm not in GENERIC_FLUFF_KEYWORDS and not norm.isdigit():
            filtered_keywords.add(kw)

    all_reqs = list(primary.union(filtered_keywords))
    return all_reqs if all_reqs else ["Python", "JavaScript", "Software Engineering"]

def search_evidence_in_resume(keyword: str, resume: StructuredResume) -> Tuple[str, Optional[str]]:
    norm_kw = normalize_term(keyword)
    if not norm_kw:
        return "missing", None
    
    # 1. Check direct skills list
    for skill in resume.skills:
        if terms_are_synonyms(norm_kw, skill):
            return "matched", f"Explicitly listed in Skills: '{skill}'"
            
    # 2. Check Summary
    if resume.summary:
        if terms_are_synonyms(norm_kw, resume.summary) or norm_kw in normalize_term(resume.summary):
            return "matched", f"Found in Summary: '{resume.summary[:120]}...'"
            
    # 3. Check Experience
    for exp in resume.experience:
        for tech in exp.technologies:
            if terms_are_synonyms(norm_kw, tech):
                return "matched", f"Used at {exp.company} ({exp.title}): '{tech}'"
        for bullet in exp.bullets:
            norm_b = normalize_term(bullet)
            if norm_kw in norm_b or any(terms_are_synonyms(norm_kw, word) for word in norm_b.split()):
                return "matched", f"Demonstrated at {exp.company}: '{bullet[:120]}...'"

    # 4. Check Projects
    if resume.projects:
        for proj in resume.projects:
            for tech in proj.technologies:
                if terms_are_synonyms(norm_kw, tech):
                    return "matched", f"Used in project '{proj.name}': '{tech}'"
            for bullet in proj.bullets:
                norm_b = normalize_term(bullet)
                if norm_kw in norm_b or any(terms_are_synonyms(norm_kw, word) for word in norm_b.split()):
                    return "matched", f"Demonstrated in project '{proj.name}': '{bullet[:120]}...'"

    # 5. Synonym/Underrepresented check
    for canon, syns in SYNONYM_MAP.items():
        if terms_are_synonyms(norm_kw, canon):
            all_syns = [canon] + syns
            for syn in all_syns:
                for skill in resume.skills:
                    if normalize_term(syn) == normalize_term(skill):
                        return "underrepresented", f"Resume lists '{skill}', which relates to job requirement '{keyword}'"
                for exp in resume.experience:
                    for tech in exp.technologies:
                        if normalize_term(syn) == normalize_term(tech):
                            return "underrepresented", f"Experience with '{tech}' at {exp.company} relates to '{keyword}'"

    return "missing", None

def calculate_match_analysis(resume: StructuredResume, job: JobPostingSchema) -> Dict[str, Any]:
    required_reqs = clean_required_reqs(job)

    matched_skills = []
    underrepresented_skills = []
    missing_skills = []
    evidence_list: List[EvidenceItem] = []

    for req in required_reqs:
        status, evidence_text = search_evidence_in_resume(req, resume)
        if status == "matched":
            matched_skills.append(req)
            evidence_list.append(EvidenceItem(
                keyword=req,
                status="matched",
                evidence=evidence_text,
                confidence=0.95
            ))
        elif status == "underrepresented":
            underrepresented_skills.append(req)
            evidence_list.append(EvidenceItem(
                keyword=req,
                status="underrepresented",
                evidence=evidence_text,
                confidence=0.80,
                suggestion=f"Consider explicitly mentioning '{req}' in your skills section or summary if accurate."
            ))
        else:
            missing_skills.append(req)
            evidence_list.append(EvidenceItem(
                keyword=req,
                status="missing",
                evidence=None,
                confidence=1.0,
                suggestion=f"Missing requirement. DO NOT add unless you have unlisted experience with '{req}'."
            ))

    total_reqs = len(required_reqs)
    matched_cnt = len(matched_skills)
    underrepresented_cnt = len(underrepresented_skills)

    # 1. Skills score (35%)
    raw_skills_ratio = (matched_cnt + (underrepresented_cnt * 0.75)) / max(1, total_reqs)
    skills_score = round(min(100.0, raw_skills_ratio * 100), 1)

    # 2. Experience score (30%) - evaluates structure + bullet quality
    exp_count = len(resume.experience)
    base_exp = 85.0 if exp_count >= 2 else (75.0 if exp_count == 1 else 50.0)
    
    action_verb_count = 0
    total_bullets = 0
    for exp in resume.experience:
        for b in exp.bullets:
            total_bullets += 1
            words = [w.lower() for w in b.split()]
            if any(verb in words for verb in ACTION_VERBS):
                action_verb_count += 1

    exp_quality_bonus = 0.0
    if total_bullets > 0 and (action_verb_count / total_bullets) >= 0.4:
        exp_quality_bonus = 12.0
    elif total_bullets > 0:
        exp_quality_bonus = 6.0

    exp_score = round(min(100.0, base_exp + exp_quality_bonus), 1)

    # 3. Projects score (15%)
    proj_count = len(resume.projects) if resume.projects else 0
    base_proj = 85.0 if proj_count >= 2 else (75.0 if proj_count == 1 else 55.0)
    proj_score = round(min(100.0, base_proj + (10.0 if proj_count > 0 else 0.0)), 1)

    # 4. Education score (10%)
    edu_score = 100.0 if resume.education and len(resume.education) > 0 else 75.0

    # 5. Keywords & Summary Alignment Score (10%)
    title_aligned = check_title_alignment(job.title, resume)

    kw_bonus = 15.0 if title_aligned else 0.0
    kw_score = round(min(100.0, skills_score + kw_bonus), 1)

    # Weighted overall match score
    overall_score = round(
        (skills_score * 0.35) +
        (exp_score * 0.30) +
        (proj_score * 0.15) +
        (edu_score * 0.10) +
        (kw_score * 0.10),
        1
    )
    overall_score = max(0.0, min(100.0, overall_score))

    score_breakdown = ScoreBreakdown(
        skills=skills_score,
        experience=exp_score,
        projects=proj_score,
        education=edu_score,
        keywords=kw_score
    )

    # ATS Checks
    ats_checks = [
        {
            "name": "Keyword Coverage",
            "passed": skills_score >= 70.0 or (matched_cnt / max(1, total_reqs)) >= 0.6,
            "detail": f"{matched_cnt}/{total_reqs} technical job requirements matched."
        },
        {
            "name": "Resume Structure",
            "passed": bool(resume.summary and len(resume.experience) > 0 and len(resume.skills) > 0),
            "detail": "Standard resume sections (Summary, Experience, Skills, Education) are properly present."
        },
        {
            "name": "Job Title & Role Alignment",
            "passed": title_aligned,
            "detail": f"Target title '{job.title}' alignment matched with candidate profile."
        },
        {
            "name": "Bullet Point Formatting",
            "passed": all(len(exp.bullets) > 0 for exp in resume.experience),
            "detail": "Work experience entries contain actionable bullet points."
        }
    ]
    
    passed_checks = sum(1 for c in ats_checks if c["passed"])
    ats_score = round((passed_checks / len(ats_checks)) * 100, 1)

    ats_analysis = ATSAnalysis(
        ats_score=ats_score,
        checks=ats_checks
    )

    return {
        "overall_score": overall_score,
        "score_breakdown": score_breakdown.model_dump(),
        "matched_skills": matched_skills,
        "underrepresented_skills": underrepresented_skills,
        "missing_skills": missing_skills,
        "evidence_list": [item.model_dump() for item in evidence_list],
        "ats_analysis": ats_analysis.model_dump()
    }


