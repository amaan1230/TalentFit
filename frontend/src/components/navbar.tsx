'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, FileText, Zap, History, Settings, LogOut, Key, Check, X } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiKey, setAiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProvider = localStorage.getItem('talentfit_ai_provider') || 'openai';
      const storedKey = localStorage.getItem('talentfit_ai_key') || '';
      setAiProvider(storedProvider);
      setAiKey(storedKey);
    }
  }, []);

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('talentfit_ai_provider', aiProvider);
      localStorage.setItem('talentfit_ai_key', aiKey.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      setIsAiModalOpen(false);
    }
  };

  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentfit_ai_provider');
      localStorage.removeItem('talentfit_ai_key');
      setAiProvider('openai');
      setAiKey('');
      setIsAiModalOpen(false);
    }
  };

  const hasCustomKey = aiKey.trim().length > 5;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            TalentFit<span className="text-brand-400 font-extrabold ml-0.5">AI</span>
          </span>
        </Link>

        {/* Auth Nav */}
        {user ? (
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                pathname === '/dashboard' ? 'text-brand-400 bg-brand-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              href="/resumes"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                pathname === '/resumes' ? 'text-brand-400 bg-brand-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Resumes</span>
            </Link>

            <Link
              href="/optimizer"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                pathname === '/optimizer'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/20'
              }`}
            >
              <Zap className="w-4 h-4 fill-brand-400 text-brand-400" />
              <span>Optimize Job</span>
            </Link>

            {/* AI Key Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                hasCustomKey
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/80'
              }`}
              title="Configure AI Model & Custom API Key"
            >
              <Key className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden md:inline">{hasCustomKey ? `${aiProvider.toUpperCase()} Key` : 'AI Key Settings'}</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            <div className="flex items-center space-x-2 pl-1">
              <span className="text-sm text-slate-300 font-medium hidden md:inline truncate max-w-[120px]">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 px-4 py-2 rounded-lg shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>

      {/* AI Key Settings Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Custom AI Key Configuration</h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAiSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Select AI Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAiProvider('openai')}
                    className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                      aiProvider === 'openai'
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    OpenAI (GPT-4o)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiProvider('gemini')}
                    className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                      aiProvider === 'gemini'
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Google Gemini
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Enter Your {aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API Key
                </label>
                <input
                  type="password"
                  placeholder={aiProvider === 'openai' ? 'sk-...' : 'AIzaSy...'}
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Leave blank to use default server API key. Your key is saved locally in your browser only.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {hasCustomKey ? (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="text-xs font-semibold text-red-400 hover:underline"
                  >
                    Use System Default
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500">System default key active</span>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center space-x-1 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Key</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

