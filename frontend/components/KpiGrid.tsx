'use client';

import React from 'react';
import { DollarSign, TrendingUp, Users, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { KpiCard } from '../lib/types';

interface KpiGridProps {
  kpis: KpiCard[];
}

export function KpiGrid({ kpis }: KpiGridProps) {
  if (!kpis || kpis.length === 0) return null;

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('revenue') || l.includes('spend')) return DollarSign;
    if (l.includes('order')) return ShoppingCart;
    if (l.includes('account') || l.includes('customer')) return Users;
    return CheckCircle2;
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, idx) => {
        const Icon = getIcon(kpi.label);
        return (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg shadow-black/20 backdrop-blur-sm transition duration-200 hover:border-slate-700 hover:bg-slate-900/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-white">{kpi.value}</div>
              {kpi.change && (
                <div className="flex items-center text-xs font-semibold text-emerald-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  <span>{kpi.change}</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center text-[11px] text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5" />
              <span>Grounded in verified database records</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
