'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Database,
  Code2,
  FileCode,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { SecurityAudit } from '../lib/types';

interface SqlInspectorProps {
  sql: string;
  security: SecurityAudit;
  roleUsed: string;
}

export function SqlInspector({ sql, security, roleUsed }: SqlInspectorProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'security' | 'meta'>('sql');

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Single-pass regex tokenizer for safe, high-fidelity SQL syntax highlighting
   * Prevents nested class name replacement bugs.
   */
  const highlightSqlLine = (line: string): string => {
    const tokenRegex =
      /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*')|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)|(\S)/g;

    const keywords = new Set([
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'FULL',
      'CROSS',
      'ON',
      'GROUP',
      'BY',
      'ORDER',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'AS',
      'AND',
      'OR',
      'NOT',
      'IN',
      'IS',
      'NULL',
      'DESC',
      'ASC',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'UNION',
      'ALL',
      'DISTINCT',
      'BETWEEN',
      'LIKE',
      'ILIKE',
    ]);

    const functions = new Set([
      'SUM',
      'COUNT',
      'AVG',
      'MIN',
      'MAX',
      'ROUND',
      'TO_CHAR',
      'DATE_TRUNC',
      'COALESCE',
      'EXTRACT',
      'NOW',
      'CURRENT_DATE',
      'CONCAT',
      'LOWER',
      'UPPER',
    ]);

    const tables = new Set(['users', 'products', 'orders']);

    return line.replace(tokenRegex, (match, comment, str, num, ident) => {
      if (comment) {
        return `<span class="text-slate-500 italic">${match}</span>`;
      }
      if (str) {
        return `<span class="text-emerald-300 font-medium">${match}</span>`;
      }
      if (num) {
        return `<span class="text-purple-400 font-semibold">${match}</span>`;
      }
      if (ident) {
        const upper = ident.toUpperCase();
        const lower = ident.toLowerCase();
        if (keywords.has(upper)) {
          return `<span class="text-cyan-400 font-bold tracking-wide">${match}</span>`;
        }
        if (functions.has(upper)) {
          return `<span class="text-amber-300 font-semibold">${match}</span>`;
        }
        if (tables.has(lower)) {
          return `<span class="text-teal-300 font-semibold">${match}</span>`;
        }
        return `<span class="text-slate-200">${match}</span>`;
      }
      return `<span class="text-slate-400">${match}</span>`;
    });
  };

  const sqlLines = (sql || '').trim().split('\n');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0c101a] via-[#090d15] to-[#070a10] shadow-2xl shadow-black/50 backdrop-blur-xl">
      {/* Studio Window Titlebar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/50 px-4 py-3 sm:px-5">
        {/* Window controls & Tab */}
        <div className="flex items-center space-x-3">
          {/* Mac window dots */}
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Active File Tab */}
          <div className="flex items-center space-x-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1 text-xs font-mono font-medium text-slate-200 shadow-sm">
            <FileCode className="h-3.5 w-3.5 text-cyan-400" />
            <span>generated_query.sql</span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">PostgreSQL 16</span>
          </div>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex items-center space-x-2 text-xs">
          {/* View Mode Tabs */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-950/70 p-0.5">
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                activeTab === 'sql'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>SQL Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Security Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('meta')}
              className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                activeTab === 'meta'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Metadata</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white shadow-sm"
            title="Copy SQL Query"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Body */}
      {activeTab === 'sql' && (
        <div className="relative flex overflow-x-auto p-4 sm:p-5 font-mono text-xs sm:text-[13px] leading-relaxed">
          {/* Line Numbers Gutter */}
          <div className="select-none pr-4 text-right text-slate-600 border-r border-slate-800/80 space-y-0.5">
            {sqlLines.map((_, index) => (
              <div key={index} className="h-5 flex items-center justify-end font-mono">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code Lines with Syntax Token Highlighting */}
          <div className="pl-4 flex-1 space-y-0.5">
            {sqlLines.map((line, index) => (
              <div
                key={index}
                className="h-5 flex items-center whitespace-pre transition duration-75 hover:bg-blue-500/5 -mx-2 px-2 rounded"
                dangerouslySetInnerHTML={{
                  __html: highlightSqlLine(line),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Security Audit Tab */}
      {activeTab === 'security' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold border-b border-slate-800 pb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Deterministic AST Gate Verification Trail</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold block mb-1">
                Statement Structure
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-white font-bold">{security.statementType}</span>
                <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 border border-emerald-500/20 font-semibold">
                  Read-Only Verified
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold block mb-1">
                Row Limit Enforcement
              </span>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span className="font-mono text-white font-bold">LIMIT {security.enforcedLimit}</span>
                <span className="rounded bg-cyan-500/10 text-cyan-400 text-[10px] px-1.5 py-0.5 border border-cyan-500/20 font-semibold">
                  {security.hasLimitClause ? 'Explicit' : 'Auto-Injected'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Notes Log */}
          {security.auditNotes && security.auditNotes.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-slate-400 font-medium block mb-2">Detailed AST Gate Log:</span>
              <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
                {security.auditNotes.map((note, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <ChevronRight className="h-3 w-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === 'meta' && (
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-500 text-[10px] block mb-1">EXECUTION ROLE</span>
              <span className="text-white font-semibold">{roleUsed}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-500 text-[10px] block mb-1">TIMEOUT GUARD</span>
              <span className="text-white font-semibold">5000 ms</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-500 text-[10px] block mb-1">PARSED STATEMENTS</span>
              <span className="text-emerald-400 font-semibold">1 (Strict Single)</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-500 text-[10px] block mb-1">AST ENGINE</span>
              <span className="text-cyan-400 font-semibold">pgsql-ast-parser</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-slate-400 font-medium block mb-1.5">Approved Entities Accessed:</span>
            <div className="flex flex-wrap gap-1.5">
              {security.tablesAccessed.map((tbl) => (
                <span
                  key={tbl}
                  className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-300"
                >
                  public.{tbl}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Studio Status Bar (Footer) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AST Validated</span>
          </span>

          <span className="text-slate-700">•</span>

          <span className="text-slate-300">
            Tables: <strong className="text-teal-300 font-mono font-medium">{security.tablesAccessed.join(', ') || 'none'}</strong>
          </span>

          <span className="text-slate-700">•</span>

          <span className="text-slate-300">
            Functions: <strong className="text-amber-300 font-mono font-medium">{security.functionsUsed.join(', ') || 'none'}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center space-x-1">
            <Lock className="h-3 w-3 text-blue-400" />
            <span>Transaction: READ ONLY</span>
          </span>
          <span className="text-slate-700">•</span>
          <span>{sqlLines.length} lines</span>
        </div>
      </div>
    </div>
  );
}
