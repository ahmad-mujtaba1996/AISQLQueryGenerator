'use client';

import React, { useState } from 'react';
import { X, Database, Key, Link as LinkIcon, BookOpen, Layers } from 'lucide-react';
import { DatabaseSchema } from '../lib/types';

interface SchemaExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema | null;
}

export function SchemaExplorerModal({ isOpen, onClose, schema }: SchemaExplorerModalProps) {
  const [activeTab, setActiveTab] = useState<'tables' | 'rules'>('tables');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0c101a] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Database Relational Schema</h2>
              <p className="text-xs text-slate-400">Approved analytics entities and business definitions</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-slate-800 bg-slate-950/60 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('tables')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  activeTab === 'tables' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Entities ({schema?.tables.length || 3})
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  activeTab === 'rules' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Business Rules
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'tables' ? (
            <div className="grid gap-6">
              {schema?.tables.map((table) => (
                <div
                  key={table.name}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-blue-400">public.{table.name}</span>
                      <span className="text-xs text-slate-400 font-medium">({table.displayName})</span>
                    </div>
                    <span className="text-xs text-slate-500 italic">{table.description}</span>
                  </div>

                  {/* Columns List */}
                  <div className="mt-4 divide-y divide-slate-800/60 text-xs">
                    {table.columns.map((col) => (
                      <div key={col.name} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-slate-200">{col.name}</span>
                          <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">
                            {col.type}
                          </span>
                          {col.isPrimary && (
                            <span className="inline-flex items-center space-x-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                              <Key className="h-2.5 w-2.5" />
                              <span>PK</span>
                            </span>
                          )}
                          {col.isForeign && (
                            <span className="inline-flex items-center space-x-1 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                              <LinkIcon className="h-2.5 w-2.5" />
                              <span>FK: {col.references}</span>
                            </span>
                          )}
                        </div>

                        <div className="text-slate-400 text-right sm:max-w-md">
                          <span>{col.description}</span>
                          {col.sampleValues && (
                            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                              Samples: {col.sampleValues.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Relationships */}
                  {table.relationships && table.relationships.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-xl text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Foreign Key Linkages:</span>
                      <ul className="mt-1 space-y-1">
                        {table.relationships.map((rel, idx) => (
                          <li key={idx} className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                            <span className="text-blue-400">→</span>
                            <span>{rel}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span>Analytical Calculation & Scope Rules</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  These domain-specific constraints are deterministically passed to the AI prompt context without requiring vector embeddings.
                </p>

                <div className="mt-4 space-y-3">
                  {schema?.businessRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs text-slate-300 leading-relaxed"
                    >
                      <div className="font-mono text-cyan-400 font-semibold mb-1">Rule #{idx + 1}</div>
                      <div>{rule}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          <span>Vectorless Retrieval Architecture: Dynamic Context Assembly</span>
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
