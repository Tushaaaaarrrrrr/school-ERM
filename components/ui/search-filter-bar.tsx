'use client';

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onClearAll?: () => void;
  actions?: React.ReactNode;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onClearAll,
  actions,
}: SearchFilterBarProps) {
  const hasActiveFilters = searchQuery !== '' || filters.some((f) => f.value !== '');

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={
              searchQuery ? (
                <button onClick={() => onSearchChange('')} className="pointer-events-auto">
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Dropdown Filters (1 Row on Mobile) */}
        {filters.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-nowrap overflow-x-auto sm:overflow-visible pb-0.5 sm:pb-0">
            {filters.map((filter) => (
              <div key={filter.id} className="flex-1 min-w-[85px] sm:min-w-[130px] sm:flex-initial">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full text-[11px] sm:text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2 sm:px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer truncate"
                >
                  <option value="">{filter.label}: All</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {hasActiveFilters && onClearAll && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-slate-500 shrink-0 self-start sm:self-auto">
            Clear filters
          </Button>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
