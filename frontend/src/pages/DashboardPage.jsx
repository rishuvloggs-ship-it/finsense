import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, PiggyBank, Percent,
  Plus, Upload, ArrowRight, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import { analyticsAPI, transactionsAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import CategoryBadge from '../components/CategoryBadge'
import TransactionModal from '../components/TransactionModal'
import CSVImportModal from '../components/CSVImportModal'
import toast from 'react-hot-toast'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const DATE_RANGES = [
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
]

function getDateRange(value) {
  const now = new Date()
  switch (value) {
    case 'month': return { startDate: format(startOfMonth(now), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') }
    case '3months': return { startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') }
    case '6months': return { startDate: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') }
    case 'year': return { startDate: format(startOfYear(now), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') }
    default: return { startDate: format(startOfMonth(now), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') }
  }
}

const PIE_COLORS = ['#3b82f6','#f97316','#ef4444','#8b5cf6','#eab308','#ec4899','#22c55e','#6366f1','#06b6d4','#10b981','#14b8a6','#9ca3af']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [range, setRange] = useState('month')
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [categories, setCategories] = useState([])
  const [recentTxns, setRecentTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = getDateRange(range)
      const [sumRes, monthRes, catRes, txnRes] = await Promise.all([
        analyticsAPI.getSummary(params),
        analyticsAPI.getMonthly({ months: 6 }),
        analyticsAPI.getCategories(params),
        transactionsAPI.getAll({ limit: 5, page: 1, sortBy: 'date', sortOrder: 'desc' }),
      ])
      setSummary(sumRes.data)
      setMonthly(monthRes.data?.data || monthRes.data || [])
      setCategories(catRes.data?.data || catRes.data || [])
      setRecentTxns(txnRes.data?.transactions || txnRes.data?.data || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetchData() }, [fetchData])

  const income = summary?.totalIncome || 0
  const expenses = summary?.totalExpenses || 0
  const savings = income - expenses
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Here's your financial overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-gray-400" />
        {DATE_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r.value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} title="Total Income" value={fmt(income)} variant="blue" loading={loading} />
        <StatCard icon={TrendingDown} title="Total Expenses" value={fmt(expenses)} variant="red" loading={loading} />
        <StatCard icon={PiggyBank} title="Net Savings" value={fmt(savings)} variant="green" loading={loading} />
        <StatCard icon={Percent} title="Savings Rate" value={`${savingsRate}%`} variant="purple" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Overview</h2>
          {loading ? (
            <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : monthly.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => fmt(val)} labelStyle={{ color: '#374151' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Expenses by Category</h2>
          {loading ? (
            <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : categories.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No expense data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => fmt(val)} />
                <Legend formatter={(val) => <span style={{ fontSize: 11 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Recent Transactions</h2>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No transactions yet. Add one to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentTxns.map((txn) => (
              <div key={txn.id || txn._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    txn.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                  }`}>
                    {txn.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{txn.description}</p>
                    <p className="text-xs text-gray-400">{txn.date ? format(new Date(txn.date), 'MMM dd, yyyy') : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <CategoryBadge category={txn.category} />
                  <span className={`text-sm font-semibold ${txn.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {txn.type === 'income' ? '+' : '-'}{fmt(txn.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchData} />
      <CSVImportModal isOpen={showImport} onClose={() => setShowImport(false)} onSuccess={fetchData} />
    </div>
  )
}
