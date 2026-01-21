import React, { useState, useMemo } from 'react';
import { PackingRecord, PACKAGE_COLUMNS } from '../types';
import { ChevronUp, ChevronDown, ChevronsUpDown, X, Info, Package, CheckCircle2 } from 'lucide-react';

interface DataTableProps {
  data: PackingRecord[];
  isDarkMode?: boolean;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const DataTable: React.FC<DataTableProps> = ({ data, isDarkMode }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Selected row for detail modal
  const [selectedRecord, setSelectedRecord] = useState<PackingRecord | null>(null);

  // Get all unique keys from the first record to use as headers, filtering out ID and Timestamp
  const headers = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'Timestamp') : [];
  
  // Prioritize common headers and move Remark to the very end
  const prioritizedHeaders = ['Date', 'Shipment', 'Mode', 'Product', 'SI QTY', 'QTY'];
  const otherHeaders = headers.filter(h => !prioritizedHeaders.includes(h) && h !== 'Remark');
  const sortedHeaders = [...prioritizedHeaders, ...otherHeaders, ...(headers.includes('Remark') ? ['Remark'] : [])];

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

  // Format date from yyyy-mm-dd to dd-mm-yyyy for display
  const formatDateForDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateStr;
  };

  // Helper to format cell values
  const formatCell = (header: string, value: string | number | undefined) => {
    if (header === 'Date' && typeof value === 'string') {
      return formatDateForDisplay(value);
    }
    return value;
  };

  return (
    <>
      <div className={`rounded-xl shadow-sm border overflow-hidden flex flex-col h-[calc(100vh-270px)] transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                {sortedHeaders.map(header => (
                  <th 
                    key={header} 
                    className={`p-3 text-xs font-black uppercase tracking-wider whitespace-nowrap sticky top-0 cursor-pointer transition-colors select-none group border-b-2 ${
                      isDarkMode 
                        ? 'bg-slate-900 text-blue-400 hover:bg-slate-800 border-b-blue-500/50' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-b-blue-500'
                    }`}
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center justify-center gap-1">
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
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {currentData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedRecord(row)}
                >
                  {sortedHeaders.map(header => (
                    <td key={`${row.id}-${header}`} className={`p-3 text-sm whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
        <div className={`p-4 border-t flex justify-between items-center flex-shrink-0 ${
          isDarkMode 
            ? 'border-slate-700 bg-slate-800' 
            : 'border-slate-200 bg-white'
        }`}>
          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Showing {sortedData.length > 0 ? page * rowsPerPage + 1 : 0} to {Math.min((page + 1) * rowsPerPage, sortedData.length)} of {sortedData.length} records
          </span>
          <div className="flex space-x-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className={`px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Previous
            </button>
            <button 
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className={`px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="bg-blue-600 p-5 text-white flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">Record Details</h3>
                  <p className="text-blue-100 text-sm">View complete record information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Summary */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Shipment Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm">Date</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatDateForDisplay(selectedRecord.Date)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm">Customer</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedRecord.Shipment}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm">Product</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedRecord.Product}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm">Mode</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedRecord.Mode}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm">SI QTY</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedRecord["SI QTY"]}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 text-sm">Total QTY</span>
                      <span className={`font-black text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{selectedRecord.QTY?.toLocaleString()}</span>
                    </div>
                    {selectedRecord.Remark && (
                       <div className="flex justify-between border-b border-slate-100 pb-2">
                         <span className="text-slate-500 text-sm">Remark</span>
                         <span className={`font-bold truncate max-w-[200px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedRecord.Remark}</span>
                       </div>
                    )}
                  </div>
                </div>

                {/* Packages Summary */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Packaging Usage
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKAGE_COLUMNS.filter(col => (selectedRecord[col] as number) > 0).map(col => (
                      <div key={col} className={`p-2 rounded-lg border flex justify-between items-center ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-xs font-bold text-slate-500 uppercase truncate mr-2" title={col}>{col.replace(' QTY', '')}</span>
                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedRecord[col]}</span>
                      </div>
                    ))}
                    {PACKAGE_COLUMNS.every(col => (selectedRecord[col] as number) === 0 || !selectedRecord[col]) && (
                      <div className={`col-span-2 py-6 text-center text-sm rounded-lg italic ${isDarkMode ? 'text-slate-400 bg-slate-700/30' : 'text-slate-400 bg-slate-50'}`}>
                        No packages specified.
                      </div>
                    )}
                  </div>
                  {/* Total Packages Sum */}
                  {PACKAGE_COLUMNS.some(col => (selectedRecord[col] as number) > 0) && (
                    <div className={`mt-3 p-2 rounded-lg border-2 flex justify-between items-center ${isDarkMode ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-50 border-emerald-200'}`}>
                      <span className="text-xs font-bold text-emerald-600 uppercase">Total Packages</span>
                      <span className={`font-black text-lg ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {PACKAGE_COLUMNS.reduce((sum, col) => sum + ((selectedRecord[col] as number) || 0), 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;