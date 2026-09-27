'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { CoverLetter } from '@/types';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Wand2,
  Sliders
} from 'lucide-react';

export default function CoverLetterPage() {
  const params = useParams();
  const id = params?.id as string;

  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadExisting() {
      try {
        const data = await apiFetch<CoverLetter>(`/cover-letter/${id}`);
        setCoverLetter(data);
        setContent(data.content);
      } catch (err: any) {
        // Not generated yet, trigger auto generation
        generateCoverLetter();
      } finally {
        setLoading(false);
      }
    }
    if (id) loadExisting();
  }, [id]);

  const generateCoverLetter = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiFetch<CoverLetter>('/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: id, custom_notes: customNotes.trim() || undefined })
      });
      setCoverLetter(res);
      setContent(res.content);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const refineLetter = async (instruction: 'shorten' | 'professional' | 'technical') => {
    if (!coverLetter) return;
    setGenerating(true);
    setError('');
    try {
      const res = await apiFetch<CoverLetter>('/cover-letter/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_letter_id: coverLetter.id, instruction })
      });
      setCoverLetter(res);
      setContent(res.content);
    } catch (err: any) {
      setError(err.message || 'Failed to refine cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = async (docType: 'cover_letter_pdf' | 'cover_letter_docx') => {
    const token = localStorage.getItem('talentfit_token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_URL || 'https://talentfit-ptbk.onrender.com/api';
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
      a.download = docType === 'cover_letter_pdf' ? 'Cover_Letter.pdf' : 'Cover_Letter.docx';
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

  if (loading || generating) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-300 font-semibold text-sm">Generating your personalized cover letter...</p>
        <p className="text-slate-500 text-xs">Connecting your matched skills and experience to the job requirements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link href={`/analysis/${id}`} className="text-xs font-semibold text-brand-400 hover:underline flex items-center space-x-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Analysis Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Personal Cover Letter</h1>
          <p className="text-xs text-slate-400 mt-1">Directly connects your verified candidate history to the job posting requirements.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3.5 py-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={() => downloadFile('cover_letter_pdf')}
            disabled={!!downloading}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-60"
          >
            {downloading === 'cover_letter_pdf' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{downloading === 'cover_letter_pdf' ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={() => downloadFile('cover_letter_docx')}
            disabled={!!downloading}
            className="px-4 py-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center space-x-1.5 transition-all disabled:opacity-60"
          >
            {downloading === 'cover_letter_docx' ? <RefreshCw className="w-4 h-4 animate-spin text-brand-400" /> : <FileText className="w-4 h-4 text-brand-400" />}
            <span>{downloading === 'cover_letter_docx' ? 'Generating...' : 'Download DOCX'}</span>
          </button>
        </div>
      </div>

      {/* AI Fine-tuning Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <Wand2 className="w-4 h-4 text-brand-400" />
          <span>AI Tone Adjustments:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refineLetter('shorten')}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            Shorten
          </button>
          <button
            onClick={() => refineLetter('professional')}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            Make More Professional
          </button>
          <button
            onClick={() => refineLetter('technical')}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            Emphasize Tech Skills
          </button>
          <button
            onClick={generateCoverLetter}
            className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-xs font-bold border border-brand-500/20 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">Interactive Cover Letter Editor</span>
          <span>You can manually edit any text directly below</span>
        </div>

        <textarea
          rows={16}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-6 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
