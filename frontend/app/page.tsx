'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { QueryWorkspace } from '../components/QueryWorkspace';
import { KpiGrid } from '../components/KpiGrid';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { SqlInspector } from '../components/SqlInspector';
import { DataTable } from '../components/DataTable';
import { SchemaExplorerModal } from '../components/SchemaExplorerModal';
import { SecurityAuditModal } from '../components/SecurityAuditModal';
import { runAnalyticsQuery, getSchema, getHealth } from '../lib/api';
import { QueryResponse, DatabaseSchema, HealthStatus } from '../lib/types';
import { ShieldAlert, AlertCircle, RefreshCw, Sparkles, Database, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isSchemaOpen, setIsSchemaOpen] = useState<boolean>(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);

  // Initial load: fetch health, schema, and prime initial analytics dashboard
  useEffect(() => {
    async function initPlatform() {
      try {
        const healthData = await getHealth().catch(() => null);
        if (healthData) setHealth(healthData);

        const schemaData = await getSchema().catch(() => null);
        if (schemaData) setSchema(schemaData);

        // Pre-load default canonical view for instant showcase
        setIsLoading(true);
        const initialQuery = await runAnalyticsQuery('Show the top five customers by spending');
        setQueryResponse(initialQuery);
      } catch (err) {
        console.warn('Initial load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initPlatform();
  }, []);

  const handleRunQuery = async (prompt: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await runAnalyticsQuery(prompt);
      setQueryResponse(response);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to execute query. Ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation */}
      <Navbar
        health={health}
        onOpenSchema={() => setIsSchemaOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Natural Language Query Bar */}
        <QueryWorkspace onSearch={handleRunQuery} isLoading={isLoading} />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-4 text-rose-300 flex items-center justify-between shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-rose-200">Execution Error: </span>
                {errorMessage}
              </div>
            </div>
            <button
              onClick={() => handleRunQuery('Show the top five customers by spending')}
              className="text-xs underline hover:text-white transition flex items-center space-x-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset to default</span>
            </button>
          </div>
        )}

        {/* Security Rejection Banner (When AST Gate blocks an unsafe or injection attempt) */}
        {queryResponse && queryResponse.status === 'rejected' && (
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-rose-950/20 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-start space-x-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                    Security Policy Violation Detected & Blocked
                  </h3>
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono text-rose-400 font-bold border border-rose-500/30">
                    AST GUARD: REJECTED
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed font-normal">
                  {queryResponse.summary}
                </p>

                {queryResponse.security.auditNotes && queryResponse.security.auditNotes.length > 0 && (
                  <div className="mt-3 rounded-lg border border-rose-900/40 bg-slate-950/60 p-3 text-xs text-slate-400 font-mono">
                    <span className="text-rose-400 font-semibold">Security Audit Log:</span>
                    <ul className="mt-1 space-y-1">
                      {queryResponse.security.auditNotes.map((note, i) => (
                        <li key={i}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800" />
            <div className="h-40 rounded-2xl bg-slate-900/60 border border-slate-800" />
          </div>
        )}

        {/* Analytics Results Body */}
        {!isLoading && queryResponse && queryResponse.status === 'success' && (
          <div className="space-y-8">
            {/* KPI Metric Cards */}
            <KpiGrid kpis={queryResponse.kpis} />

            {/* AI Executive Summary & Chart in Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Grounded Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <ExecutiveSummary
                  summary={queryResponse.summary}
                  insights={queryResponse.keyInsights}
                  rowCount={queryResponse.rowCount}
                  durationMs={queryResponse.executionDurationMs}
                  mode={queryResponse.mode}
                />
              </div>

              {/* Dynamic Interactive Chart (7 cols) */}
              <div className="lg:col-span-7">
                <AnalyticsChart
                  config={queryResponse.chartConfig}
                  data={queryResponse.data}
                />
              </div>
            </div>

            {/* Refined SQL Studio & AST Security Inspector */}
            <SqlInspector
              sql={queryResponse.sql}
              security={queryResponse.security}
              roleUsed={queryResponse.roleUsed}
            />

            {/* Interactive Data Table */}
            <DataTable
              columns={queryResponse.columns}
              data={queryResponse.data}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#07090e]/90 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">DataPulse AI</span>
            <span>•</span>
            <span>Production Grade SaaS Analytics Platform</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1 text-slate-400">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Zero-Hallucination Evidence Slicing</span>
            </span>
            <span className="inline-flex items-center space-x-1 text-slate-400">
              <Database className="h-3 w-3 text-blue-400" />
              <span>Supabase PostgreSQL + Prisma</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SchemaExplorerModal
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        schema={schema}
      />

      <SecurityAuditModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />
    </div>
  );
}
