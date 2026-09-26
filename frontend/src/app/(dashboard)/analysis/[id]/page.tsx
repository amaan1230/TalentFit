'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { JobAnalysis } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart2,
  FileText,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronDown,
  Info
} from 'lucide-react';

export default function MatchDashboardPage() {
  const params = useParams();
  const id = params?.id as string;
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'underrepresented' | 'missing'>('all');

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const data = await apiFetch<JobAnalysis>(`/analyses/${id}`);
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis record');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadAnalysis();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading match analysis dashboard...</div>;
  }

  if (error || !analysis) {
    return (
      <div className="py-12 text-center text-red-400">
        <p>{error || 'Analysis record not found.'}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-xs font-bold text-brand-400 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { overall_score, score_breakdown, matched_skills, underrepresented_skills, missing_skills, evidence_list, ats_analysis, job_title, company } = analysis;

  const filteredEvidence = evidence_list.filter(item => {
    if (activeTab === 'matched') return item.status === 'matched';
    if (activeTab === 'underrepresented') return item.status === 'underrepresented';
    if (activeTab === 'missing') return item.status === 'missing';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Factual Match Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{job_title}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{company} • Analysis Date: {new Date(analysis.created_at).toLocaleDateString()}</p>
        </div>

        {/* Score Radial Badge */}
        <div className="flex items-center space-x-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="text-center">
            <div className={`text-4xl font-black ${
              overall_score >= 80 ? 'text-emerald-400' : overall_score >= 60 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {overall_score}%
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Overall Match</div>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          <div className="space-y-2">
            <Link
              href={`/analysis/${id}/resume`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Optimize Resume</span>
            </Link>

            <Link
              href={`/analysis/${id}/cover-letter`}
              className="px-4 py-2 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center space-x-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>Generate Cover Letter</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Score Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-brand-400" />
          <span>Explainable Score Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">Skills</div>
            <div className="text-2xl font-bold text-white mt-1">{score_breakdown.skills}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full" style={{ width: `${score_breakdown.skills}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">Experience</div>
            <div className="text-2xl font-bold text-white mt-1">{score_breakdown.experience}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${score_breakdown.experience}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">Projects</div>
            <div className="text-2xl font-bold text-white mt-1">{score_breakdown.projects}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${score_breakdown.projects}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">Education</div>
            <div className="text-2xl font-bold text-white mt-1">{score_breakdown.education}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${score_breakdown.education}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">Keywords</div>
            <div className="text-2xl font-bold text-white mt-1">{score_breakdown.keywords}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${score_breakdown.keywords}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Categories Summary Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MATCHED */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>MATCHED ({matched_skills.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matched_skills.map((s, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                ✓ {s}
              </span>
            ))}
          </div>
        </div>

        {/* UNDERREPRESENTED */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>UNDERREPRESENTED ({underrepresented_skills.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {underrepresented_skills.length === 0 ? (
              <span className="text-xs text-slate-500">None detected</span>
            ) : (
              underrepresented_skills.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                  ⚠ {s}
                </span>
              ))
            )}
          </div>
        </div>

        {/* MISSING */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-red-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
              <XCircle className="w-4 h-4" />
              <span>MISSING ({missing_skills.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missing_skills.length === 0 ? (
              <span className="text-xs text-slate-500">None! Complete coverage</span>
            ) : (
              missing_skills.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-semibold">
                  ✕ {s}
                </span>
              ))
            )}
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
            *Missing skills are NEVER auto-added to your resume.
          </p>
        </div>
      </div>

      {/* Evidence-Based Deep Dive Drawer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <span>Evidence Verification Audit</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Verified candidate quotes proving match status for each requirement.</p>
          </div>

          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            {(['all', 'matched', 'underrepresented', 'missing'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  activeTab === tab ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredEvidence.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-sm flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    item.status === 'matched' ? 'bg-emerald-400' : item.status === 'underrepresented' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span>{item.keyword}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.status === 'matched' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'underrepresented' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {item.status}
                </span>
              </div>

              {item.evidence ? (
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 text-slate-300 font-mono text-[11px]">
                  <span className="text-slate-500 select-none">Evidence Quote: </span>
                  "{item.evidence}"
                </div>
              ) : (
                <div className="text-slate-500 italic text-[11px]">
                  No evidence found in original CV. (Will not be fabricated)
                </div>
              )}

              {item.suggestion && (
                <div className="text-slate-400 flex items-start space-x-1.5 text-[11px] pt-1">
                  <Info className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                  <span>{item.suggestion}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ATS Compatibility Check */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">ATS Compatibility Audit</h2>
          <span className="text-xl font-extrabold text-brand-400">{ats_analysis.ats_score}% ATS Compliance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ats_analysis.checks.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-200">{c.name}</span>
                {c.passed ? (
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Improve</span>
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
