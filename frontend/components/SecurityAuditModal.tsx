'use client';

import React from 'react';
import { X, ShieldCheck, Lock, Terminal, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityAuditModal({ isOpen, onClose }: SecurityAuditModalProps) {
  if (!isOpen) return null;

  const securityLayers = [
    {
      title: 'Structural AST Security Gate',
      subtitle: 'PostgreSQL Abstract Syntax Tree Parser (pgsql-ast-parser)',
      description:
        'Every single AI-generated SQL query is parsed into a syntax tree before execution. Rejects multiple statements (piggybacked queries), DDL (DROP, ALTER, CREATE), write operations (INSERT, UPDATE, DELETE, TRUNCATE), and comment injections.',
      icon: Terminal,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      status: 'Enforced',
    },
    {
      title: 'Dedicated Least-Privilege Supabase Role',
      subtitle: 'datapulse_analytics_role',
      description:
        'AI queries are executed under a dedicated restricted database role. Write, alter, and catalog permissions are revoked at the PostgreSQL engine level. Direct transaction-level READ ONLY and statement timeouts (5000ms) prevent resource exhaustion.',
      icon: Lock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      status: 'Role Configured',
    },
    {
      title: 'Adversarial Prompt Injection Defense',
      subtitle: 'Deterministic Pre-Execution Guard',
      description:
        'Pre-screens natural language inquiries for jailbreaks, system-prompt extraction attempts, role reversal ("you are now in god mode"), and embedded SQL manipulation before any LLM inference occurs.',
      icon: ShieldAlert,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      status: 'Active',
    },
    {
      title: 'Controlled Self-Correction Policy',
      subtitle: 'Capped at 2 retries; zero retries on auth violations',
      description:
        'Permits up to two controlled retry cycles for correctable syntax or relation errors. Authorization failures and security violations are rejected immediately and permanently with an audit log.',
      icon: RefreshCw,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      status: 'Policy Guarded',
    },
    {
      title: 'Structured Context Slicing & No-Hallucination Summaries',
      subtitle: 'Evidence-Grounded Business Intelligence',
      description:
        'Raw database results are compacted and sliced into verified metric tables. Gemini 2.5 Flash operates strictly as an evidence synthesizer without speculating on external causes or fabricating figures.',
      icon: CheckCircle2,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      status: 'Grounded',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0c101a] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Security & Governance Architecture</h2>
              <p className="text-xs text-slate-400">Deterministic server-side controls and defense-in-depth</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300">
            <p>
              DataPulse AI implements a zero-trust execution model. All user prompts and model outputs are treated as untrusted inputs. Security is enforced through <span className="font-semibold text-white">deterministic AST parsing</span>, <span className="font-semibold text-white">PostgreSQL role isolation</span>, and <span className="font-semibold text-white">transactional read-only constraints</span> rather than relying on LLM instructions alone.
            </p>
          </div>

          <div className="grid gap-4">
            {securityLayers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border ${layer.borderColor} bg-slate-900/50 p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${layer.bgColor} ${layer.color} border ${layer.borderColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">{layer.title}</h3>
                        <p className="text-[11px] font-mono text-slate-400">{layer.subtitle}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                      {layer.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 leading-relaxed pl-12">
                    {layer.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          <span>Enterprise Defense-in-Depth Specification</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1 font-medium text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
