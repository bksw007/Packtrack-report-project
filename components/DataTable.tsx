import React, { useState, useMemo } from 'react';
import { PackingRecord } from '../types';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface DataTableProps {
  data: PackingRecord[];
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Get all unique keys from the first record to use as headers, filtering out ID
  const headers = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id') : [];
  
  // Prioritize common headers
  const prioritizedHeaders = ['Date', 'Shipment', 'Mode', 'Product', 'SI QTY', 'QTY'];
  const otherHeaders = headers.filter(h => !prioritizedHeaders.includes(h));
  const sortedHeaders = [...prioritizedHeaders, ...otherHeaders];

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      // If values are numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string compare
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Reset page when data changes
  React.useEffect(() => {
    setPage(0);
  }, [data.length]);

  // Helper to format ISO date (yyyy-mm-dd) back to dd/mm/yyyy for display
  const formatCell = (header: string, value: string | number) => {
    if (header === 'Date' && typeof value === 'string') {
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }
    }
    return value;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-270px)]">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {sortedHeaders.map(header => (
                <th 
                  key={header} 
                  className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  onClick={() => handleSort(header)}
                >
                  <div className="flex items-center gap-1">
                    {header}
                    <span className="text-slate-400">
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {sortedHeaders.map(header => (
                  <td key={`${row.id}-${header}`} className="p-3 text-sm text-slate-700 whitespace-nowrap">
                    {formatCell(header, row[header])}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
               <tr>
                 <td colSpan={sortedHeaders.length} className="p-8 text-center text-slate-400">
                   No data matching filters.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center flex-shrink-0">
        <span className="text-sm text-slate-500">
          Showing {sortedData.length > 0 ? page * rowsPerPage + 1 : 0} to {Math.min((page + 1) * rowsPerPage, sortedData.length)} of {sortedData.length} records
        </span>
        <div className="flex space-x-2">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button 
            disabled={page >= totalPages - 1 || totalPages === 0}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;