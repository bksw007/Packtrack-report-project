import React, { useState, useEffect, useRef } from 'react';
import { PackingRecord, PACKAGE_COLUMNS } from '../types';
import { Save, ArrowLeft, CheckCircle2, Package, Info, ChevronRight, Calendar as CalendarIcon, ChevronDown, ClipboardPaste, X } from 'lucide-react';

interface DataInputFormProps {
  onSave: (record: PackingRecord) => Promise<void> | void;
  onCancel: () => void;
  existingCustomers?: string[];
  existingProducts?: string[];
  isDarkMode?: boolean;
}

/**
 * A Custom Select Component that allows selecting from a list OR typing a new value.
 */
interface CreatableSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  isDarkMode?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({ 
  label, name, value, onChange, options, placeholder, required, isDarkMode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on input
  useEffect(() => {
    const filtered = options.filter(opt => 
      opt.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [value, options]);

  const handleSelect = (option: string) => {
    // Create a synthetic event to match the native input signature
    const syntheticEvent = {
      target: { name, value: option, type: 'text' }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">{label}</label>
      <div className="relative group">
        <input 
          type="text" 
          name={name} 
          required={required}
          placeholder={placeholder}
          value={value} 
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none pr-10 focus:ring-2 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-blue-500 placeholder-slate-500' 
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-blue-500'
          }`}
        />
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 absolute right-4 top-3.5 transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && filteredOptions.length > 0 && (
        <div className={`absolute z-20 w-full mt-1 border rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 ${
           isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
           {filteredOptions.map((opt, idx) => (
             <button
                key={`${opt}-${idx}`}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-blue-400' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
             >
               {opt}
             </button>
           ))}
        </div>
      )}
    </div>
  );
};

const DataInputForm: React.FC<DataInputFormProps> = ({ 
  onSave, 
  onCancel, 
  existingCustomers = [], 
  existingProducts = [],
  isDarkMode
}) => {
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [formData, setFormData] = useState<Partial<PackingRecord>>({
    Date: new Date().toISOString().split('T')[0],
    Shipment: '',
    Mode: '',
    Product: '',
    "SI QTY": 1,
    QTY: 0,
    Remark: '',
    ...PACKAGE_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: 0 }), {})
  });

  // Batch Entry Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Default Modes
  const modeOptions = ['SEA', 'AIR', 'TRUCK', 'COURIER'];

  // Date input ref for clicking anywhere to open date picker
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format date from yyyy-mm-dd to dd-mm-yyyy for display
  const formatDateForDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateStr;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  /**
   * Parse batch data from Excel and map to PACKAGE_COLUMNS
   */
  const parseBatchData = (text: string) => {
    const lines = text.trim().split('\n');
    const updates: Partial<PackingRecord> = {};

    lines.forEach(line => {
      // Split by tab
      const parts = line.split('\t');
      if (parts.length < 2) return;

      const rawName = parts[0].trim().toUpperCase();
      const qty = parseInt(parts[1].trim(), 10) || 0;

      // Extract dimension pattern (e.g., 110x110x115, 27X27X22)
      const dimensionMatch = rawName.match(/(\d+X?\d+X?\d+)/i);
      const dimension = dimensionMatch ? dimensionMatch[1].toUpperCase() : null;

      // Special cases for WARP QTY
      if (rawName === 'PALLET' || rawName.startsWith('WOODEN CASE')) {
        updates['WARP QTY'] = (updates['WARP QTY'] as number || 0) + qty;
        return;
      }

      // Special case for UNIT
      if (rawName === 'UNIT') {
        updates['UNIT QTY'] = qty;
        return;
      }

      // Special case for RETURNABLE
      if (rawName.startsWith('RETURNABLE')) {
        updates['RETURNABLE QTY'] = qty;
        return;
      }

      // Find matching column by dimension
      if (dimension) {
        const matchingCol = PACKAGE_COLUMNS.find(col => {
          const colDimension = col.replace(' QTY', '').toUpperCase();
          return colDimension === dimension;
        });
        if (matchingCol) {
          updates[matchingCol] = qty;
        }
      }
    });

    // Update formData with parsed values
    setFormData(prev => ({ ...prev, ...updates }));
    setShowBatchModal(false);
    setBatchText('');
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    const finalRecord: PackingRecord = {
      ...formData as PackingRecord,
      id: `record-${Date.now()}`
    };
    await onSave(finalRecord);
    setIsSaving(false);
  };

  if (step === 'review') {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">Review Information</h3>
                <p className="text-blue-100 text-sm">Please double check the details before saving.</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Shipment Summary
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Date</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatDateForDisplay(formData.Date)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Customer</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Shipment}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Product</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Product}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Mode</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Mode}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">SI QTY</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData["SI QTY"]}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 text-sm">Total QTY</span>
                    <span className={`font-black text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{formData.QTY?.toLocaleString()}</span>
                  </div>
                  {formData.Remark && (
                     <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500 text-sm">Remark</span>
                       <span className={`font-bold truncate max-w-[200px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData.Remark}</span>
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
                <div className="grid grid-cols-2 gap-3">
                  {PACKAGE_COLUMNS.filter(col => (formData[col] as number) > 0).map(col => (
                    <div key={col} className={`p-3 rounded-lg border flex justify-between items-center ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-xs font-bold text-slate-500 uppercase truncate mr-2" title={col}>{col.replace(' QTY', '')}</span>
                      <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formData[col]}</span>
                    </div>
                  ))}
                  {PACKAGE_COLUMNS.every(col => (formData[col] as number) === 0) && (
                    <div className="col-span-2 py-8 text-center text-slate-400 text-sm bg-slate-50 rounded-lg italic">
                      No packages specified.
                    </div>
                  )}
                </div>
                {/* Total Packages Sum */}
                {PACKAGE_COLUMNS.some(col => (formData[col] as number) > 0) && (
                  <div className={`mt-4 p-3 rounded-lg border-2 flex justify-between items-center ${isDarkMode ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-50 border-emerald-200'}`}>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Total Packages</span>
                    <span className={`font-black text-lg ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {PACKAGE_COLUMNS.reduce((sum, col) => sum + ((formData[col] as number) || 0), 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setStep('edit')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-bold transition-colors ${
                   isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back to Edit
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? 'Saving...' : 'Confirm & Save Record'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <form onSubmit={handleReview} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left: General Info */}
          <div className="lg:col-span-1 flex flex-col">
            <div className={`p-6 rounded-2xl shadow-sm border flex-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Info className="w-4 h-4 text-blue-600" />
                Shipment Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Shipment Date</label>
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => dateInputRef.current?.showPicker()}
                  >
                    <input 
                      ref={dateInputRef}
                      type="date" name="Date" required
                      value={formData.Date} onChange={handleChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-xl font-semibold transition-all outline-none focus:ring-2 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-blue-500'
                      }`}
                      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                    />
                    <CalendarIcon className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <CreatableSelect 
                  label="Customer Name"
                  name="Shipment"
                  value={formData.Shipment || ''}
                  onChange={handleChange as any}
                  options={existingCustomers}
                  placeholder="Select or enter customer"
                  required
                  isDarkMode={isDarkMode}
                />

                <CreatableSelect 
                  label="Product Description"
                  name="Product"
                  value={formData.Product || ''}
                  onChange={handleChange as any}
                  options={existingProducts}
                  placeholder="Select or enter product"
                  required
                  isDarkMode={isDarkMode}
                />

                <CreatableSelect 
                  label="Mode"
                  name="Mode"
                  value={formData.Mode || ''}
                  onChange={handleChange as any}
                  options={modeOptions}
                  placeholder="Select transport mode"
                  required
                  isDarkMode={isDarkMode}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">SI QTY</label>
                    <input 
                      type="number" name="SI QTY" min="1" required
                      value={formData["SI QTY"]} onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Total Product QTY</label>
                    <input 
                      type="number" name="QTY" min="0" required
                      value={formData.QTY} onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl font-semibold transition-all outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-blue-500'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                   <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Remark</label>
                   <textarea
                      name="Remark"
                      rows={2}
                      value={formData.Remark || ''}
                      onChange={handleChange}
                       placeholder="Optional notes..."
                      className={`w-full px-4 py-3 border rounded-xl font-medium transition-all outline-none resize-none text-sm focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-blue-500 placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-blue-500'
                      }`}
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Package Details */}
          <div className="lg:col-span-2 flex flex-col">
            <div className={`p-6 rounded-2xl shadow-sm border flex-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-sm font-black flex items-center gap-2 uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Package className="w-4 h-4 text-emerald-600" />
                  Packaging Breakdown
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Batch Entry
                  </button>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Dimensions QTY</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
                {PACKAGE_COLUMNS.map(col => (
                  <div key={col} className="group">
                    <label className="block text-[10px] font-black text-slate-500 mb-1 group-focus-within:text-emerald-600 transition-colors truncate uppercase tracking-tight" title={col}>
                      {col.replace(' QTY', '')}
                    </label>
                    <div className="relative">
                      <input 
                        type="number" name={col} min="0"
                        value={formData[col]} onChange={handleChange}
                        placeholder="0"
                        className={`w-full px-4 py-2.5 border rounded-xl font-bold transition-all outline-none text-sm focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-emerald-500 placeholder-slate-600' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-emerald-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-black group-focus-within:hidden">PCS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Entry Modal */}
            {showBatchModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardPaste className="w-6 h-6" />
                      <div>
                        <h3 className="text-lg font-bold">Batch Entry</h3>
                        <p className="text-emerald-100 text-sm">Paste data from Excel</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowBatchModal(false); setBatchText(''); }}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <textarea
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                      placeholder="Paste Excel data here...&#10;Example:&#10;PALLET 110x110x115    5&#10;CARTON 27X27X22    3&#10;RETURNABLE P110X110X110    2"
                      rows={10}
                      className={`w-full px-4 py-3 border rounded-xl font-mono text-sm transition-all outline-none resize-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800 focus:ring-emerald-500 placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-emerald-500'
                      }`}
                    />
                    <div className="flex gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => { setShowBatchModal(false); setBatchText(''); }}
                        className={`flex-1 py-3 border rounded-xl font-bold transition-colors ${
                          isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => parseBatchData(batchText)}
                        disabled={!batchText.trim()}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className={`flex items-center justify-end gap-4 p-4 rounded-2xl border shadow-sm mt-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <button 
                type="button" onClick={onCancel}
                className="px-6 py-3 text-slate-500 font-bold hover:text-red-500 transition-colors text-sm"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl active:scale-95 text-sm uppercase tracking-widest"
              >
                Review Data
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DataInputForm;