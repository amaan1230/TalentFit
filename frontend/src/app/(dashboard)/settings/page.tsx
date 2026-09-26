'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { User, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & Plan Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your profile, entitlements, and AI optimization settings.</p>
      </div>

      {/* User Info Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <User className="w-4 h-4 text-brand-400" />
          <span>User Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400">Full Name</div>
            <div className="font-bold text-white text-sm mt-0.5">{user?.name}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400">Email Address</div>
            <div className="font-bold text-white text-sm mt-0.5">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Plan Entitlement Tier Layer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Current Subscription Tier</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Flexible entitlement architecture layer active.</p>
          </div>

          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 font-bold text-xs border border-brand-500/20">
            Free Plan Tier
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative">
            <div className="font-bold text-white text-base">Free Plan</div>
            <div className="text-xs text-slate-400">Ideal for targeted single job applications.</div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>3 Job Analyses / Month</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1 Default Resume Vault Slot</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Factual Evidence Verification</span>
              </li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-900/30 to-indigo-900/30 border border-brand-500/40 space-y-4 relative">
            <div className="flex justify-between items-center">
              <div className="font-bold text-white text-base">Pro Tier</div>
              <span className="px-2 py-0.5 rounded bg-brand-500 text-white font-bold text-[10px]">RECOMMENDED</span>
            </div>
            <div className="text-xs text-slate-300">For active job seekers applying to multiple positions.</div>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                <span>Unlimited Job Analyses</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                <span>Multiple Resume Vault Slots</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                <span>Advanced Before/After AI Optimization</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                <span>PDF & DOCX Export Support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
