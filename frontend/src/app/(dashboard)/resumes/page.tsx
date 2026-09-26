'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Resume } from '@/types';
import { Upload, FileText, CheckCircle2, Trash2, Star, AlertCircle, ChevronRight, User, Briefcase, GraduationCap, Code } from 'lucide-react';

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadResumes() {
    try {
      const data = await apiFetch<Resume[]>('/resumes');
      setResumes(data);
      if (data.length > 0 && !selectedResume) {
        setSelectedResume(data.find(r => r.is_default) || data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('set_default', resumes.length === 0 ? 'true' : 'false');

    try {
      const token = localStorage.getItem('talentfit_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const newRes = await res.json();
      await loadResumes();
      setSelectedResume(newRes);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiFetch(`/resumes/${id}/set-default`, { method: 'POST' });
      await loadResumes();
    } catch (err: any) {
      setError(err.message || 'Failed to set default resume');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await apiFetch(`/resumes/${id}`, { method: 'DELETE' });
      if (selectedResume?.id === id) setSelectedResume(null);
      await loadResumes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Resume Management</h1>
          <p className="text-sm text-slate-400 mt-1">Upload PDF or DOCX resumes. Our AI extracts facts to use as evidence for matching.</p>
        </div>

        <label className={`px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 cursor-pointer flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Parsing File...' : 'Upload New Resume'}</span>
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading resumes vault...</div>
      ) : resumes.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No resumes uploaded yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">Upload your PDF or DOCX resume to start analyzing job match requirements.</p>
          <label className="mt-6 inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Select Resume File</span>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Uploaded Resumes ({resumes.length})</h2>
            <div className="space-y-3">
              {resumes.map((r) => {
                const isSelected = selectedResume?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResume(r)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-brand-500/80 shadow-md shadow-brand-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                          r.is_default ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.file_type.includes('pdf') ? 'PDF' : 'DOC'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm truncate max-w-[160px]">{r.filename}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSetDefault(r.id)}
                          title={r.is_default ? "Default Resume" : "Set as Default"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            r.is_default ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${r.is_default ? 'fill-amber-400' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleDelete(r.id)}
                          title="Delete Resume"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {r.is_default && (
                      <span className="mt-3 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[10px] font-bold border border-brand-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active Default</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Structured Resume Preview */}
          <div className="lg:col-span-2">
            {selectedResume ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white">Parsed Fact Structure</h2>
                    <p className="text-xs text-slate-400">Target evidence extracted for job matching algorithms.</p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{selectedResume.filename}</span>
                </div>

                {/* Contact & Summary */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-brand-400" />
                    <span>Candidate Details</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm space-y-2">
                    <div className="font-bold text-white">{selectedResume.parsed_json.name || 'Candidate'}</div>
                    <div className="text-xs text-slate-400">
                      {[selectedResume.parsed_json.email, selectedResume.parsed_json.phone, selectedResume.parsed_json.location].filter(Boolean).join(' • ')}
                    </div>
                    {selectedResume.parsed_json.summary && (
                      <p className="text-xs text-slate-300 italic pt-2 border-t border-slate-800/60">
                        "{selectedResume.parsed_json.summary}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Extracted Skills ({selectedResume.parsed_json.skills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResume.parsed_json.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                {selectedResume.parsed_json.experience.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Work History</span>
                    </div>
                    <div className="space-y-3">
                      {selectedResume.parsed_json.experience.map((exp, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-white text-sm">
                            <span>{exp.title} — <span className="text-brand-300">{exp.company}</span></span>
                            <span className="text-xs font-normal text-slate-400">{exp.dates}</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-300">
                            {exp.bullets.map((b, bi) => (
                              <li key={bi} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">Select a resume to view parsed facts.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
