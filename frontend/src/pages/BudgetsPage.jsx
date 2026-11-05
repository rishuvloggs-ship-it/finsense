import React, { useState, useEffect, useCallback } from 'react'
import { X, Loader2, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'
import { budgetsAPI } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const CATEGORIES = [
  { name: 'Food', emoji: '🍔' },
  { name: 'Rent', emoji: '🏠' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Bills', emoji: '💡' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Health', emoji: '💊' },
  { name: 'Education', emoji: '📚' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Investments', emoji: '📈' },
  { name: 'Other', emoji: '📦' },
]

function SetBudgetModal({ isOpen, onClose, category, currentBudget, onSave }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) setAmount(currentBudget ? String(currentBudget) : '')
  }, [isOpen, currentBudget])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) < 0) return toast.error('Enter a valid amount')
    setLoading(true)
    try {
      await onSave(Number(amount))
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Set Budget — {category}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Budget ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Budget
          </button>
        </form>
      </div>
    </div>
  )
}

function BudgetCard({ cat, budget, spent, onSetBudget }) {
  const hasB = budget > 0
  const pct = hasB ? Math.min((spent / budget) * 100, 100) : 0
  const over = hasB && spent > budget
  const remaining = budget - spent

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border ${over ? 'border-red-200 dark:border-red-800' : 'border-gray-100 dark:border-gray-800'} p-5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cat.emoji}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{cat.name}</h3>
            {over && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle className="w-3 h-3" /> Over budget
              </span>
            )}
            {!over && hasB && pct >= 80 && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Near limit</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onSetBudget(cat.name, budget)}
          className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 font-medium transition-colors"
        >
          {hasB ? 'Edit' : 'Set Budget'}
        </button>
      </div>

      {hasB ? (
        <>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">Spent: <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(spent)}</span></span>
            <span className="text-gray-500 dark:text-gray-400">Budget: <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(budget)}</span></span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-primary-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-xs font-medium ${over ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {over ? `${fmt(Math.abs(remaining))} over budget` : `${fmt(remaining)} remaining`}
          </p>
        </>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-gray-400">No budget set</p>
          {spent > 0 && <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">Spent: {fmt(spent)}</p>}
        </div>
      )}
    </div>
  )
}

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCategory, setModalCategory] = useState('')
  const [modalCurrentBudget, setModalCurrentBudget] = useState(0)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await budgetsAPI.getAll({ month, year })
      setBudgets(res.data?.budgets || res.data?.data || res.data || [])
    } catch {
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const handleSetBudget = (category, currentBudget) => {
    setModalCategory(category)
    setModalCurrentBudget(currentBudget || 0)
    setModalOpen(true)
  }

  const handleSaveBudget = async (amount) => {
    try {
      await budgetsAPI.upsert({ category: modalCategory, amount, month, year })
      toast.success(`Budget for ${modalCategory} updated!`)
      fetchBudgets()
    } catch {
      toast.error('Failed to save budget')
      throw new Error()
    }
  }

  const getBudgetData = (categoryName) => {
    const b = budgets.find((x) => x.category === categoryName)
    return { budget: b?.amount || 0, spent: b?.spent || 0 }
  }

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0)
  const healthPct = totalBudget > 0 ? Math.max(0, Math.min(100, ((totalBudget - totalSpent) / totalBudget) * 100)) : null
  const overCategories = budgets.filter((b) => b.spent > b.amount && b.amount > 0).length

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budgets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Set and track your monthly spending limits</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[2023, 2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget Health Score */}
      {!loading && totalBudget > 0 && (
        <div className={`rounded-xl p-5 border ${overCategories > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${overCategories > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'}`}>
                {overCategories > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <h2 className={`font-semibold ${overCategories > 0 ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>
                  Budget Health Score: {healthPct?.toFixed(0)}%
                </h2>
                <p className={`text-sm ${overCategories > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {overCategories > 0 ? `${overCategories} category over budget` : 'On track this month!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Budget</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{fmt(totalBudget)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className={`font-bold ${totalSpent > totalBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{fmt(totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                <p className={`font-bold ${totalBudget - totalSpent < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{fmt(totalBudget - totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
              <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const { budget, spent } = getBudgetData(cat.name)
            return (
              <BudgetCard
                key={cat.name}
                cat={cat}
                budget={budget}
                spent={spent}
                onSetBudget={handleSetBudget}
              />
            )
          })}
        </div>
      )}

      <SetBudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={modalCategory}
        currentBudget={modalCurrentBudget}
        onSave={handleSaveBudget}
      />
    </div>
  )
}
