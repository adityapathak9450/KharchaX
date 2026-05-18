import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/apiClient.js';

export function CSVImportModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    amount: '',
    type: '',
    category: '',
    date: '',
    notes: '',
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const importCSVMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/transactions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Transactions imported successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to import transactions');
    },
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelect(csvFile);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      parseCSV(file);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const headerRow = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setHeaders(headerRow);
        
        const dataRows = lines.slice(1, 6).map(line => 
          line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
        );
        setCsvData(dataRows);
        setStep(2);
      }
    };
    reader.readAsText(file);
  };

  const handleColumnMappingChange = (field, value) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }));
  };

  const canProceedToStep3 = () => {
    return columnMapping.amount && columnMapping.type && columnMapping.category && columnMapping.date;
  };

  const handleImport = async () => {
    try {
      await importCSVMutation.mutateAsync(selectedFile);
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setSelectedFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({
      amount: '',
      type: '',
      category: '',
      date: '',
      notes: '',
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1a1a1a] border border-white/[0.08] rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
            <h2 className="text-xl font-semibold text-white">Import Transactions</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center p-6 space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= stepNumber
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-8 h-0.5 mx-2 transition-all ${
                      step > stepNumber ? 'bg-indigo-600' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Upload */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-2">Upload CSV File</h3>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">
                    Drop your CSV file here
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    or click to browse
                  </p>
                  <p className="text-gray-500 text-xs">
                    Maximum file size: 5MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-2">Preview</h3>
                <div className="bg-[#0f0f0f] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{selectedFile?.name}</span>
                    <span className="text-xs text-gray-500">
                      ({csvData.length + 1} rows)
                    </span>
                  </div>
                  
                  {/* Table Preview */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          {headers.map((header, index) => (
                            <th key={index} className="text-left p-2 text-gray-400 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-white/5">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 text-gray-300">
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Map Columns */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-2">Map Columns</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Select which CSV column corresponds to each field
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Amount *</label>
                    <select
                      value={columnMapping.amount}
                      onChange={(e) => handleColumnMappingChange('amount', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select column</option>
                      {headers.map((header, index) => (
                        <option key={index} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Type *</label>
                    <select
                      value={columnMapping.type}
                      onChange={(e) => handleColumnMappingChange('type', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select column</option>
                      {headers.map((header, index) => (
                        <option key={index} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Category *</label>
                    <select
                      value={columnMapping.category}
                      onChange={(e) => handleColumnMappingChange('category', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select column</option>
                      {headers.map((header, index) => (
                        <option key={index} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Date *</label>
                    <select
                      value={columnMapping.date}
                      onChange={(e) => handleColumnMappingChange('date', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select column</option>
                      {headers.map((header, index) => (
                        <option key={index} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Notes</label>
                    <select
                      value={columnMapping.notes}
                      onChange={(e) => handleColumnMappingChange('notes', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select column</option>
                      {headers.map((header, index) => (
                        <option key={index} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!canProceedToStep3()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Ready to Import</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {csvData.length + 1} transactions will be imported
                  </p>
                </div>
                
                <div className="bg-[#0f0f0f] rounded-lg p-4 space-y-2">
                  <div className="text-sm text-gray-400">
                    <strong>File:</strong> {selectedFile?.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    <strong>Column Mapping:</strong>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {Object.entries(columnMapping).map(([field, column]) => (
                      column && (
                        <div key={field}>
                          {field.charAt(0).toUpperCase() + field.slice(1)} → {column}
                        </div>
                      )
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importCSVMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importCSVMutation.isPending ? 'Importing...' : 'Import Transactions'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CSVImportModal;
