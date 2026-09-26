'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  FileCheck,
  Search,
  ShieldCheck,
  Target,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does TalentFit AI fabricate experience or add fake skills to my CV?",
      a: "Never. Our core engine operates under strict factual evidence rules. Missing skills are flagged as missing, and AI optimization only emphasizes and rephrases evidence that already exists in your candidate history."
    },
    {
      q: "How does the job URL extraction work?",
      a: "Simply paste the URL of any public job posting. Our backend fetches the web page, strips out navigation and ads, and extracts structured job requirements using AI. If a page has strict paywalls, you can paste the job description directly."
    },
    {
      q: "Is the match score explainable?",
      a: "Yes! Unlike generic AI scores, TalentFit AI calculates a deterministic score across 5 weighted categories: Skills (35%), Experience (30%), Projects (15%), Education (10%), and Keywords (10%)."
    },
    {
      q: "Can I download my optimized resume and cover letter?",
      a: "Yes, you can review every suggested change before accepting, and download final ATS-compliant PDF and DOCX files with one click."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800/60">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Factual Evidence-Based Resume Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Tailor Your Resume to <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Every Job</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Analyze any job posting, optimize your resume, discover missing keywords, and generate a personalized cover letter in seconds.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/optimizer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Analyze a Job</span>
            </Link>

            <Link
              href="/resumes"
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-semibold text-base border border-slate-700/80 transition-all flex items-center justify-center space-x-2"
            >
              <FileCheck className="w-5 h-5 text-brand-400" />
              <span>Upload Resume</span>
            </Link>
          </div>

          {/* Quick Metrics Badge Row */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/60 text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-black text-brand-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Factual Evidence Guarantee</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-black text-emerald-400">5-Sec</div>
              <div className="text-xs text-slate-400 mt-1">URL & Text Job Parser</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-black text-purple-400">Deterministic</div>
              <div className="text-xs text-slate-400 mt-1">Explainable Scoring</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-2xl font-black text-indigo-400">PDF & DOCX</div>
              <div className="text-xs text-slate-400 mt-1">Instant Export</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-950 border-b border-slate-800/60 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white tracking-tight">How It Works</h2>
            <p className="mt-3 text-slate-400">Four simple steps from job link to ATS-perfect application.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg mb-4 border border-brand-500/20">1</div>
              <h3 className="text-lg font-bold text-white">Upload CV</h3>
              <p className="text-sm text-slate-400 mt-2">Upload your PDF or DOCX resume. We parse it into structured facts.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/20">2</div>
              <h3 className="text-lg font-bold text-white">Paste Job Link</h3>
              <p className="text-sm text-slate-400 mt-2">Enter a Job URL or paste the job description text for instant extraction.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-4 border border-purple-500/20">3</div>
              <h3 className="text-lg font-bold text-white">Match & Review</h3>
              <p className="text-sm text-slate-400 mt-2">Inspect explainable match scores, evidence quotes, and before/after suggestions.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-500/20">4</div>
              <h3 className="text-lg font-bold text-white">Generate & Export</h3>
              <p className="text-sm text-slate-400 mt-2">Generate a tailored cover letter and download optimized CV & letter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-slate-900/50 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white">Designed for High-Converting Applications</h2>
            <p className="mt-3 text-slate-400">Everything you need to beat ATS filters and impress hiring managers.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <BarChart3 className="w-8 h-8 text-brand-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Explainable Match Score</h3>
              <p className="text-sm text-slate-400 mt-2">Transparent score breakdown across Skills, Work Experience, Projects, Education, and Keyword coverage.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Evidence-Based AI</h3>
              <p className="text-sm text-slate-400 mt-2">Every suggestion is linked to explicit evidence in your CV. Zero fake experience or unproven skill fabrication.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <Target className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Missing Keyword Detector</h3>
              <p className="text-sm text-slate-400 mt-2">Spot missing and underrepresented terms instantly so you know exactly where your application stands.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <Layers className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Before / After Review</h3>
              <p className="text-sm text-slate-400 mt-2">Full control over your resume changes. Accept or reject suggestions item-by-item before downloading.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <FileSpreadsheet className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Tailored Cover Letter Generator</h3>
              <p className="text-sm text-slate-400 mt-2">Generates genuine, non-generic cover letters connecting your actual verified achievements to the job requirements.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <FileCheck className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">ATS Compatibility Audit</h3>
              <p className="text-sm text-slate-400 mt-2">Automated structure, title alignment, and keyword density checks before you submit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-white">Why TalentFit AI?</h2>
            <p className="mt-3 text-slate-400">See how our evidence-backed approach compares to generic AI tools.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-sm">
                  <th className="p-4 text-slate-300 font-semibold">Feature</th>
                  <th className="p-4 text-brand-400 font-bold">TalentFit AI</th>
                  <th className="p-4 text-slate-400 font-normal">Generic AI Generators</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                <tr>
                  <td className="p-4 font-medium text-white">Factual Safety Guard</td>
                  <td className="p-4 text-emerald-400 font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guaranteed Evidence-Only</span>
                  </td>
                  <td className="p-4 text-red-400">Often fabricates unearned skills</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Scoring System</td>
                  <td className="p-4 text-brand-400 font-semibold">Deterministic Weighted Math</td>
                  <td className="p-4 text-slate-400">Random LLM score out of 100</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Job Input Methods</td>
                  <td className="p-4 text-slate-200">URL Fetcher + Raw Text Paste</td>
                  <td className="p-4 text-slate-400">Text Paste only</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Change Control</td>
                  <td className="p-4 text-slate-200">Interactive Before/After Accept/Reject</td>
                  <td className="p-4 text-slate-400">Auto-overwrites whole document</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-400">Got questions? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-semibold text-white flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-brand-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-slate-300 text-sm border-t border-slate-800/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 TalentFit AI. All rights reserved. Factual AI Job Application Engine.</div>
          <div className="flex space-x-6 text-slate-400">
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/register" className="hover:text-white">Register</Link>
            <Link href="/optimizer" className="hover:text-white">Optimizer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
