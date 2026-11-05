import React, { useState, useRef } from 'react'
import { X, Upload, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react'
import Papa from 'papaparse'
import { transactionsAPI } from '../lib/api'
import toast from 'react-hot-toast'

const REQUIRED_FIELDS = ['description', 'amount', 'type', 'date']
const OPTIONAL_FIELDS = ['paymentMethod']
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

const STEP_LABELS = ['Upload CSV', 'Map Columns', 'Import']

export default function CSVImportModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [preview, setPreview] = useState([])
  const [mapping, setMapping] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const reset = () => {
    setStep(1)
    setFile(null)
    setHeaders([])
    setPreview([])
    setMapping({})
    setResult(null)
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    Papa.parse(f, {
      header: true,
      preview: 6,
      skipEmptyLines: true,
      complete: (results) => {
        const hdrs = results.meta.fields || []
        setHeaders(hdrs)
        setPreview(results.data.slice(0, 5))
        // Auto-map obvious headers
        const autoMap = {}
        ALL_FIELDS.forEach((field) => {
          const match = hdrs.find(
            (h) => h.toLowerCase().replace(/[\s_-]/g, '') === field.toLowerCase()
          )
          if (match) autoMap[field] = match
        })
        setMapping(autoMap)
      },
      error: () => toast.error('Failed to parse CSV'),
    })
  }

  const handleImport = async () => {
    for (const field of REQUIRED_FIELDS) {
      if (!mapping[field]) {
        toast.error(`Please map the "${field}" column`)
        return
      }
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))
      const res = await transactionsAPI.importCSV(formData)
      setResult(res.data)
      setStep(3)
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import CSV</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 gap-2">
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > i + 1
                      ? 'bg-green-500 text-white'
                      : step === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === i + 1
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-5">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors group"
              >
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {file ? (
                    <span className="font-medium text-primary-600 dark:text-primary-400">{file.name}</span>
                  ) : (
                    <>Click to upload or drag a <span className="font-medium">.csv</span> file</>
                  )}
                </p>
                {file && <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>}
              </div>

              {preview.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Preview (first 5 rows)
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="text-xs w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {headers.map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {preview.map((row, i) => (
                          <tr key={i} className="bg-white dark:bg-gray-900">
                            {headers.map((h) => (
                              <td key={h} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap truncate max-w-[120px]">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Match your CSV columns to the required fields:
              </p>
              {ALL_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex-shrink-0">
                    {field}
                    {REQUIRED_FIELDS.includes(field) && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </label>
                  <select
                    value={mapping[field] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">— skip —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && (() => {
            const errorCount = Array.isArray(result.errors) ? result.errors.length : (Number(result.errors) || 0)
            return (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Import Complete</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.imported} transactions imported successfully
                    {errorCount > 0 && `, ${errorCount} rows skipped`}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{result.imported} Imported</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">{errorCount} Errors</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={step === 1 ? handleClose : () => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step === 1 && (
              <button
                onClick={() => {
                  if (!file || !headers.length) return toast.error('Please upload a CSV file first')
                  setStep(2)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Importing...' : 'Import'}
              </button>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="flex justify-center px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
