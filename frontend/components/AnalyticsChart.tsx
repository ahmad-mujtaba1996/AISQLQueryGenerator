'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AreaChart as AreaIcon } from 'lucide-react';
import { ChartConfig } from '../lib/types';

interface AnalyticsChartProps {
  config: ChartConfig;
  data: Record<string, any>[];
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#14B8A6'];

export function AnalyticsChart({ config, data }: AnalyticsChartProps) {
  const [activeType, setActiveType] = useState<'bar' | 'line' | 'area' | 'pie'>(
    config.type !== 'none' ? config.type : 'bar',
  );

  if (!config.suitable || !data || data.length === 0) {
    return null;
  }

  const formatTooltipValue = (value: any, name: any) => {
    if (typeof value === 'number') {
      const isCurrency =
        String(name).toLowerCase().includes('revenue') ||
        String(name).toLowerCase().includes('spent') ||
        String(name).toLowerCase().includes('amount') ||
        String(name).toLowerCase().includes('price');
      if (isCurrency) {
        return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
      }
      return [value.toLocaleString('en-US'), name];
    }
    return [value, name];
  };

  const formatYAxisTick = (tick: any) => {
    if (typeof tick === 'number') {
      if (tick >= 1000) {
        return `$${(tick / 1000).toFixed(0)}k`;
      }
      return tick;
    }
    return tick;
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">{config.title}</h3>
          {config.description && <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>}
        </div>

        {/* Chart View Toggles */}
        <div className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => setActiveType('bar')}
            className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              activeType === 'bar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bar</span>
          </button>

          <button
            onClick={() => setActiveType('line')}
            className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              activeType === 'line' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Line Chart"
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>

          <button
            onClick={() => setActiveType('area')}
            className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              activeType === 'area' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Area Chart"
          >
            <AreaIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Area</span>
          </button>

          {data.length <= 8 && (
            <button
              onClick={() => setActiveType('pie')}
              className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeType === 'pie' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Distribution"
            >
              <PieIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pie</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Chart Canvas */}
      <div className="mt-6 h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={config.xAxisKey}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
              {config.series.map((s, idx) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  name={s.name}
                  fill={s.color}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
              ))}
            </BarChart>
          ) : activeType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={config.xAxisKey}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
              {config.series.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: s.color }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : activeType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={config.xAxisKey}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
              {config.series.map((s) => (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
              <Pie
                data={data}
                dataKey={config.yAxisKey || config.series[0]?.dataKey}
                nameKey={config.xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
                paddingAngle={4}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
