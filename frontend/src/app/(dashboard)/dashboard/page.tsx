'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { JobAnalysis, Resume } from '@/types';
import { Zap, FileText, ArrowRight, Clock, Award, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<JobAnalysis[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, resData] = await Promise.all([
          apiFetch<JobAnalysis[]>('/analyses'),
          apiFetch<Resume[]>('/resumes')
        ]);
        setAnalyses(anData);
        setResumes(resData);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const defaultResume = resumes.find(r => r.is_default) || (resumes.length > 0 ? resumes[0] : null);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-900/40 via-indigo-900/30 to-purple-900/20 border border-brand-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>AI Job Optimizer Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Application Dashboard</h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Optimize your resume with factual evidence, analyze job match requirements, and generate tailored cover letters.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/optimizer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Optimize New Job</span>
            </Link>

            <Link
              href="/resumes"
              className="px-6 py-3 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-brand-400" />
              <span>Manage Resumes ({resumes.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Default Resume Status & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Default Resume</div>
          {defaultResume ? (
            <div className="mt-2 flex items-start justify-between">
              <div>
                <div className="font-bold text-white text-base truncate max-w-[180px]">{defaultResume.filename}</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Ready for Optimization</span>
                </div>
              </div>
              <Link href="/resumes" className="text-xs text-brand-400 hover:underline font-semibold">Change</Link>
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-sm text-amber-400 font-medium flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>No Resume Uploaded</span>
              </div>
              <Link href="/resumes" className="mt-2 inline-block text-xs text-brand-400 font-bold hover:underline">Upload Resume Now →</Link>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Job Analyses</div>
          <div className="mt-2 text-3xl font-black text-white">{analyses.length}</div>
          <div className="text-xs text-slate-400 mt-1">Previous applications stored</div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Highest Match Score</div>
          <div className="mt-2 text-3xl font-black text-brand-400">
            {analyses.length > 0 ? `${Math.max(...analyses.map(a => a.overall_score))}%` : '--'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Factual evidence match</div>
        </div>
      </div>

      {/* Recent Application History */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Applications</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any job analysis to view detailed match scores and cover letters.</p>
          </div>
          <Link href="/optimizer" className="text-xs font-bold text-brand-400 hover:underline flex items-center space-x-1">
            <span>+ New Analysis</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading applications history...</div>
        ) : analyses.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-xl">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-medium text-sm">No job analyses performed yet.</p>
            <p className="text-slate-500 text-xs mt-1">Paste a job link or job description to get started.</p>
            <Link
              href="/optimizer"
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
            >
              <span>Analyze First Job</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Job Title & Company</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4">Matched Skills</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {analyses.map((an) => (
                  <tr key={an.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{an.job_title}</div>
                      <div className="text-xs text-slate-400 font-normal">{an.company}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        an.overall_score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        an.overall_score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {an.overall_score}% Match
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-300">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {an.matched_skills.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">✓ {s}</span>
                        ))}
                        {an.matched_skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">+{an.matched_skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(an.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/analysis/${an.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-brand-400 hover:text-brand-300 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>View Results</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
