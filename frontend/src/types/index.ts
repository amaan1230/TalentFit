export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ExperienceItem {
  company: string;
  title: string;
  location?: string;
  dates: string;
  bullets: string[];
  technologies: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  bullets: string[];
  technologies: string[];
  url?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  dates: string;
  gpa_or_honors?: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  date?: string;
}

export interface StructuredResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: string[];
}

export interface Resume {
  id: string;
  filename: string;
  file_type: string;
  is_default: boolean;
  parsed_json: StructuredResume;
  created_at: string;
}

export interface JobPostingSchema {
  title: string;
  company: string;
  location?: string;
  employment_type?: string;
  experience?: string;
  education?: string;
  required_skills: string[];
  preferred_skills: string[];
  technologies: string[];
  responsibilities: string[];
  certifications: string[];
  soft_skills: string[];
  keywords: string[];
}

export interface JobPosting {
  id: string;
  url?: string;
  title: string;
  company?: string;
  extracted_json: JobPostingSchema;
  created_at: string;
}

export interface EvidenceItem {
  keyword: string;
  status: 'matched' | 'underrepresented' | 'missing';
  evidence?: string | null;
  confidence: number;
  suggestion?: string | null;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  projects: number;
  education: number;
  keywords: number;
}

export interface ATSCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ATSAnalysis {
  ats_score: number;
  checks: ATSCheck[];
}

export interface JobAnalysis {
  id: string;
  resume_id: string;
  job_posting_id: string;
  overall_score: number;
  score_breakdown: ScoreBreakdown;
  matched_skills: string[];
  underrepresented_skills: string[];
  missing_skills: string[];
  evidence_list: EvidenceItem[];
  ats_analysis: ATSAnalysis;
  created_at: string;
  job_title: string;
  company: string;
}

export interface SuggestionItem {
  id: string;
  section: string;
  before_text: string;
  after_text: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface CoverLetter {
  id: string;
  analysis_id: string;
  content: string;
  version: string;
  created_at: string;
}
