'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Resume, JobPosting, JobAnalysis } from '@/types';
import { Link as LinkIcon, FileText, Zap, AlertCircle, CheckCircle, ArrowRight, Sparkles, Upload } from 'lucide-react';

export default function OptimizerPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [error, setError] = useState('');

  const steps = [
    "Extracting & structuring job requirements...",
    "Parsing resume factual evidence...",
    "Calculating hybrid match score & missing keywords...",
    "Generating ATS optimization suggestions..."
  ];

  useEffect(() => {
    async function loadResumes() {
      try {
        const data = await apiFetch<Resume[]>('/resumes');
        setResumes(data);
        const def = data.find(r => r.is_default) || (data.length > 0 ? data[0] : null);
        if (def) setSelectedResumeId(def.id);
      } catch (err: any) {
        setError('Failed to load candidate resumes.');
      } finally {
        setLoadingResumes(false);
      }
    }
    loadResumes();
  }, []);

  const runAnalysis = async () => {
    if (!selectedResumeId) {
      setError('Please select or upload a resume before analyzing a job.');
      return;
    }

    setError('');
    setProcessingStep(1);

    try {
      let jobPostingObj: JobPosting;

      if (activeTab === 'url') {
        if (!jobUrl.trim()) {
          setError('Please enter a valid job URL.');
          setProcessingStep(0);
          return;
        }
        jobPostingObj = await apiFetch<JobPosting>('/jobs/extract-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: jobUrl.trim(), resume_id: selectedResumeId })
        });
      } else {
        if (!jobText.trim() || jobText.trim().length < 20) {
          setError('Please paste the complete job description text.');
          setProcessingStep(0);
          return;
        }
        jobPostingObj = await apiFetch<JobPosting>('/jobs/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_text: jobText.trim(),
            resume_id: selectedResumeId,
            title: customTitle.trim() || undefined,
            company: customCompany.trim() || undefined
          })
        });
      }

      setProcessingStep(2);
      await new Promise(r => setTimeout(r, 600));

      setProcessingStep(3);
      const analysisObj = await apiFetch<JobAnalysis>('/matching/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_posting_id: jobPostingObj.id
        })
      });

      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 400));

      router.push(`/analysis/${analysisObj.id}`);
    } catch (err: any) {
      setProcessingStep(0);
      const errStr = err.message || '';
      if (errStr.includes("couldn't automatically read") || errStr.includes("403") || errStr.includes("Status")) {
        setError("We couldn't automatically read this job posting. Anti-bot protections or paywalls may be blocking access.");
      } else {
        setError(errStr || 'Failed to analyze job posting.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Factual Application Optimizer</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Optimize Your Application</h1>
        <p className="text-sm text-slate-400 mt-2">
          Select your resume and enter the target job URL or description to generate a deterministic match score and ATS optimization suggestions.
        </p>
      </div>

      {/* Resume Selection Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-black">1</span>
            <span>Select Active Candidate Resume</span>
          </div>
          <button onClick={() => router.push('/resumes')} className="text-xs text-brand-400 font-semibold hover:underline">
            Manage Vault
          </button>
        </div>

        {loadingResumes ? (
          <div className="text-xs text-slate-500">Loading resumes...</div>
        ) : resumes.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <span>No resumes uploaded yet. Upload a resume first to run analysis.</span>
            <button
              onClick={() => router.push('/resumes')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
            >
              Upload Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resumes.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedResumeId(r.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedResumeId === r.id
                    ? 'bg-slate-950 border-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <FileText className={`w-5 h-5 shrink-0 ${selectedResumeId === r.id ? 'text-brand-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <div className="font-semibold text-xs text-white truncate">{r.filename}</div>
                    <div className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                {selectedResumeId === r.id && <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Input Tabs */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-black">2</span>
          <span>Target Job Input</span>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'url'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>TAB 1: Job Posting URL</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'text'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>TAB 2: Paste Job Description</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.includes("couldn't automatically read") && (
              <button
                onClick={() => {
                  setError('');
                  setActiveTab('text');
                }}
                className="mt-2 text-xs font-bold text-brand-300 underline hover:text-white"
              >
                [ Paste Job Description Instead ]
              </button>
            )}
          </div>
        )}

        {/* Tab 1: URL Input */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Job Posting Web Address</label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/... or https://careers.company.com/job/..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={processingStep > 0 || !selectedResumeId}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Analyze Job URL</span>
            </button>
          </div>
        )}

        {/* Tab 2: Text Description Input */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Title (Optional)</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company (Optional)</label>
                <input
                  type="text"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  placeholder="e.g. Nexus AI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Paste Complete Job Description</label>
              <textarea
                rows={8}
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the target job description requirements, responsibilities, skills, and qualifications here..."
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={processingStep > 0 || !selectedResumeId}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Analyze Job Description</span>
            </button>
          </div>
        )}
      </div>

      {/* Step Progress Loader Modal/Panel */}
      {processingStep > 0 && (
        <div className="p-8 rounded-2xl glass-panel border border-brand-500/30 space-y-6 text-center animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto border border-brand-500/40">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Analyzing Job Application</h3>
            <p className="text-xs text-slate-400 mt-1">Calculating factual match evidence and optimization opportunities...</p>
          </div>

          <div className="max-w-md mx-auto space-y-3 text-left">
            {steps.map((stepText, idx) => {
              const isDone = processingStep > idx + 1;
              const isCurrent = processingStep === idx + 1;
              return (
                <div key={idx} className="flex items-center space-x-3 text-xs font-medium">
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span className={isDone ? 'text-slate-300' : isCurrent ? 'text-brand-300 font-bold' : 'text-slate-600'}>
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
