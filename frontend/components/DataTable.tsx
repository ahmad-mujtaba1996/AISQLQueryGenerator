'use client';

import React, { useState, useMemo } from 'react';
import { Table, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  data: Record<string, any>[];
}

export function DataTable({ columns, data }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const pageSize = 10;

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(term)),
      );
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA || '');
        const strB = String(valB || '');
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = columns.join(',');
    const rows = data.map((r) =>
      columns.map((col) => `"${String(r[col] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `datapulse_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!columns || columns.length === 0 || !data || data.length === 0) {
    return null;
  }

  // Value formatting
  const formatCellValue = (col: string, val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-600">-</span>;

    const lowerCol = col.toLowerCase();
    if (
      typeof val === 'number' &&
      (lowerCol.includes('revenue') || lowerCol.includes('spent') || lowerCol.includes('amount') || lowerCol.includes('price'))
    ) {
      return (
        <span className="font-semibold text-emerald-400 font-mono">
          ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }

    if (lowerCol === 'status' && typeof val === 'string') {
      const s = val.toLowerCase();
      let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
      if (s === 'completed') colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      else if (s === 'pending') colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      else if (s === 'cancelled' || s === 'refunded') colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${colorClass}`}>
          {val}
        </span>
      );
    }

    if (typeof val === 'number') {
      return <span className="font-mono text-slate-200">{val.toLocaleString('en-US')}</span>;
    }

    return String(val);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Table className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Verified Query Results</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            {processedData.length} rows
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter results..."
              className="h-8 rounded-lg border border-slate-800 bg-slate-950/80 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex h-8 items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-slate-500 font-mono">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-3 px-4 font-semibold hover:text-white cursor-pointer select-none transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.replace(/_/g, ' ')}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-600" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="transition duration-150 hover:bg-slate-800/40"
              >
                <td className="py-3 px-4 text-slate-600 font-mono">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                {columns.map((col) => (
                  <td key={col} className="py-3 px-4 whitespace-nowrap">
                    {formatCellValue(col, row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
          <span>
            Page {currentPage} of {totalPages} ({processedData.length} items)
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 transition disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 transition disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
