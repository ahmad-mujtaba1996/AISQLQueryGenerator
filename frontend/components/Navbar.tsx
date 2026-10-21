'use client';

import React from 'react';
import { Database, ShieldCheck, Sparkles, Activity, Layers } from 'lucide-react';
import { HealthStatus } from '../lib/types';

interface NavbarProps {
  health: HealthStatus | null;
  onOpenSchema: () => void;
  onOpenSecurity: () => void;
}

export function Navbar({ health, onOpenSchema, onOpenSecurity }: NavbarProps) {
  const isSupabaseLive = health?.database === 'connected_live_supabase';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Identifier */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">DataPulse</span>
              <span className="rounded bg-gradient-to-r from-blue-500 to-cyan-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Autonomous Business Intelligence</p>
          </div>
        </div>

        {/* System Telemetry & Indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          {/* Database Mode Badge */}
          <div className="flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-slate-300">
            <span
              className={`h-2 w-2 rounded-full ${
                isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
              }`}
            />
            <span className="font-medium">
              {isSupabaseLive ? 'Supabase PostgreSQL' : 'Analytical Sandbox'}
            </span>
          </div>

          {/* AST Security Guard Badge */}
          <div className="flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>AST Guard Active</span>
          </div>

          {/* Model Badge */}
          <div className="flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Gemini 2.5 Flash</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSchema}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span>Schema</span>
          </button>

          <button
            onClick={onOpenSecurity}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Security Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
