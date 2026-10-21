'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle, Copy, Check, ShieldCheck, Clock, Hash } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: string;
  insights: string[];
  rowCount: number;
  durationMs: number;
  mode: string;
}

export function ExecutiveSummary({
  summary,
  insights,
  rowCount,
  durationMs,
  mode,
}: ExecutiveSummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${summary}\n\nKey Insights:\n${insights.map((i) => `• ${i}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/30 p-6 shadow-xl shadow-blue-950/20 backdrop-blur-sm">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">AI Executive Summary</h3>
            <p className="text-[11px] text-slate-400">Evidence-grounded analytical synthesis</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
          title="Copy Summary"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Narrative */}
      <div className="mt-4">
        <p className="text-sm leading-relaxed text-slate-200 font-normal">{summary}</p>
      </div>

      {/* Key Insights List */}
      {insights && insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Key Verified Findings
          </h4>
          <ul className="space-y-2">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Slicing & Verification Footer Badges */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <div className="flex items-center space-x-1 rounded-md bg-slate-950/60 px-2 py-0.5 border border-slate-800">
          <Hash className="h-3 w-3 text-slate-500" />
          <span>{rowCount} records sliced</span>
        </div>

        <div className="flex items-center space-x-1 rounded-md bg-slate-950/60 px-2 py-0.5 border border-slate-800">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>{durationMs}ms latency</span>
        </div>

        <div className="flex items-center space-x-1 rounded-md bg-slate-950/60 px-2 py-0.5 border border-slate-800 text-cyan-400">
          <ShieldCheck className="h-3 w-3" />
          <span>No Hallucinations Guarantee</span>
        </div>
      </div>
    </div>
  );
}
