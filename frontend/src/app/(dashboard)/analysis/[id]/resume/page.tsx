'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { JobAnalysis, SuggestionItem, StructuredResume } from '@/types';
import {
  Check,
  X,
  CheckCircle2,
  Download,
  FileText,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function ResumeOptimizationPage() {
  const params = useParams();
  const id = params?.id as string;

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  
  const [optimizedResume, setOptimizedResume] = useState<StructuredResume | null>(null);
  const [scores, setScores] = useState<{ originalScore: number; newScore: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const loadSuggestions = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const url = `/analysis/${id}/suggestions${forceRefresh ? '?refresh=true' : ''}`;
      const res = await apiFetch<{ suggestions: SuggestionItem[] }>(url);
      setSuggestions(res.suggestions);
      const initAccepted = res.suggestions.map(s => s.id);
      setAcceptedIds(initAccepted);
      setRejectedIds([]);

      // Fetch initial optimized resume with all accepted
      await applyChanges(initAccepted, []);
    } catch (err: any) {
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) loadSuggestions(false);
  }, [id]);

  const applyChanges = async (accepts: string[], rejects: string[]) => {
    setApplying(true);
    try {
      const res = await apiFetch<{
        optimized_resume: StructuredResume;
        original_score?: number;
        new_overall_score?: number;
      }>(`/analysis/${id}/apply-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted_ids: accepts, rejected_ids: rejects })
      });
      setOptimizedResume(res.optimized_resume);
      if (res.original_score !== undefined && res.new_overall_score !== undefined) {
        setScores({ originalScore: res.original_score, newScore: res.new_overall_score });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply changes');
    } finally {
      setApplying(false);
    }
  };

  const toggleAccept = (sugId: string) => {
    const newAccepts = acceptedIds.includes(sugId)
      ? acceptedIds.filter(i => i !== sugId)
      : [...acceptedIds, sugId];
    const newRejects = rejectedIds.filter(i => i !== sugId);

    setAcceptedIds(newAccepts);
    setRejectedIds(newRejects);
    applyChanges(newAccepts, newRejects);
  };

  const toggleReject = (sugId: string) => {
    const newRejects = rejectedIds.includes(sugId)
      ? rejectedIds.filter(i => i !== sugId)
      : [...rejectedIds, sugId];
    const newAccepts = acceptedIds.filter(i => i !== sugId);

    setAcceptedIds(newAccepts);
    setRejectedIds(newRejects);
    applyChanges(newAccepts, newRejects);
  };

  const handleAcceptAll = () => {
    const all = suggestions.map(s => s.id);
    setAcceptedIds(all);
    setRejectedIds([]);
    applyChanges(all, []);
  };

  const handleRejectAll = () => {
    const all = suggestions.map(s => s.id);
    setAcceptedIds([]);
    setRejectedIds(all);
    applyChanges([], all);
  };

  const [downloading, setDownloading] = React.useState<string | null>(null);

  const downloadFile = async (docType: 'resume_pdf' | 'resume_docx') => {
    const token = localStorage.getItem('talentfit_token');
    const API_URL = process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    setDownloading(docType);
    try {
      const res = await fetch(`${API_URL}/documents/download/${docType}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docType === 'resume_pdf' ? 'Optimized_Resume.pdf' : 'Optimized_Resume.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const formatSectionName = (sec: string) => {
    if (sec === 'summary') return 'Summary Section';
    if (sec.startsWith('experience')) return 'Work Experience Bullet';
    if (sec.startsWith('project')) return 'Project Bullet';
    if (sec.startsWith('skills')) return 'Skills Highlight';
    return sec.replace('_', ' ');
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Generating tailored CV optimizations...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link href={`/analysis/${id}`} className="text-xs font-semibold text-brand-400 hover:underline flex items-center space-x-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Analysis Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Review CV Optimization Suggestions</h1>
            {scores && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-sm">
                <span className="text-slate-400">Match Score:</span>
                <span className="text-slate-400 line-through font-semibold">{scores.originalScore}%</span>
                <span className="text-emerald-400 font-extrabold flex items-center space-x-1">
                  <span>➔ {scores.newScore}%</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">Accept or reject individual tailored suggestions. Your preview and score update in real-time.</p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadSuggestions(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl glass-card hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-700/80 flex items-center space-x-1.5 transition-all disabled:opacity-60"
            title="Re-generate all suggestions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Optimizing...' : 'Re-Optimize'}</span>
          </button>
          <button
            onClick={() => downloadFile('resume_pdf')}
            disabled={!!downloading}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-60"
          >
            {downloading === 'resume_pdf' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{downloading === 'resume_pdf' ? 'Generating...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={() => downloadFile('resume_docx')}
            disabled={!!downloading}
            className="px-4 py-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center space-x-1.5 transition-all disabled:opacity-60"
          >
            {downloading === 'resume_docx' ? <RefreshCw className="w-4 h-4 animate-spin text-brand-400" /> : <FileText className="w-4 h-4 text-brand-400" />}
            <span>{downloading === 'resume_docx' ? 'Generating...' : 'Download DOCX'}</span>
          </button>
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Suggestions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Tailored Enhancements ({suggestions.length})</span>
            </h2>

            <div className="flex items-center space-x-2 text-xs">
              <button onClick={handleAcceptAll} className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold border border-emerald-500/20">
                Accept All
              </button>
              <button onClick={handleRejectAll} className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-white font-semibold border border-slate-700">
                Reject All
              </button>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
              Your resume is already fully aligned with no additional factual changes needed!
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((sug) => {
                const isAccepted = acceptedIds.includes(sug.id);
                const isRejected = rejectedIds.includes(sug.id);

                return (
                  <div
                    key={sug.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                      isAccepted
                        ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                        : isRejected
                        ? 'bg-slate-900/30 border-slate-800/80 opacity-50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-brand-300 font-bold text-[11px]">
                        {formatSectionName(sug.section)}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => toggleAccept(sug.id)}
                          className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                            isAccepted ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accepted</span>
                        </button>

                        <button
                          onClick={() => toggleReject(sug.id)}
                          className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                            isRejected ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </button>
                      </div>
                    </div>

                    {/* Original */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Original Text:</div>
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        {sug.before_text}
                      </div>
                    </div>

                    {/* AI Enhancement */}
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>AI Suggested Enhancement:</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 font-medium leading-relaxed">
                        {sug.after_text}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="text-[11px] text-slate-400 flex items-start space-x-1.5 pt-1">
                      <Info className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span><strong>Rationale:</strong> {sug.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Optimized Resume Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Optimized CV Preview</span>
            </h2>
            {applying && <span className="text-xs text-brand-400 animate-pulse">Updating preview...</span>}
          </div>

          {optimizedResume && (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-6 shadow-2xl min-h-[600px]">
              {/* Header */}
              <div className="pb-4 border-b border-slate-800 text-center">
                <h3 className="text-xl font-extrabold text-white">{optimizedResume.name || 'Candidate Name'}</h3>
                <div className="text-xs text-slate-400 mt-1">
                  {[optimizedResume.email, optimizedResume.phone, optimizedResume.location].filter(Boolean).join(' | ')}
                </div>
              </div>

              {/* Summary */}
              {optimizedResume.summary && (
                <div className="space-y-1">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">Professional Summary</div>
                  <p className="text-slate-300 leading-relaxed text-xs pt-1">{optimizedResume.summary}</p>
                </div>
              )}

              {/* Skills */}
              {optimizedResume.skills && optimizedResume.skills.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">Skills & Tools</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {optimizedResume.skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {optimizedResume.experience && optimizedResume.experience.length > 0 && (
                <div className="space-y-4">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">Work Experience</div>
                  {optimizedResume.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between font-bold text-white text-xs">
                        <span>{exp.title} — <span className="text-brand-300">{exp.company}</span></span>
                        <span className="text-slate-500 font-normal">{exp.dates}</span>
                      </div>
                      {exp.bullets && (
                        <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px] leading-relaxed">
                          {exp.bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {optimizedResume.projects && optimizedResume.projects.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800/80 pb-1">Projects</div>
                  {optimizedResume.projects.map((proj, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold text-white text-xs">
                        <span>{proj.name}</span>
                        {proj.technologies && (
                          <span className="text-brand-300 font-normal">{proj.technologies.join(', ')}</span>
                        )}
                      </div>
                      {proj.bullets && (
                        <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px]">
                          {proj.bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


