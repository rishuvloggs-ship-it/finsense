import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, PiggyBank, Percent, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import { analyticsAPI } from '../lib/api'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n?.toFixed(1) || 0}%`

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

const CAT_COLORS = ['#3b82f6','#f97316','#ef4444','#8b5cf6','#eab308','#ec4899','#22c55e','#6366f1','#06b6d4','#10b981','#14b8a6','#9ca3af']

export default function AnalyticsPage() {
  const [range, setRange] = useState('6months')
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [categories, setCategories] = useState([])
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = getDateRange(range)
      const [sumRes, monthRes, catRes, trendRes] = await Promise.all([
        analyticsAPI.getSummary(params),
        analyticsAPI.getMonthly({ months: 12 }),
        analyticsAPI.getCategories(params),
        analyticsAPI.getTrends(params),
      ])
      setSummary(sumRes.data)
      setMonthly(monthRes.data?.data || monthRes.data || [])
      setCategories(catRes.data?.data || catRes.data || [])
      setTrends(trendRes.data?.data || trendRes.data || [])
    } catch {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetchData() }, [fetchData])

  const income = summary?.totalIncome || 0
  const expenses = summary?.totalExpenses || 0
  const savings = income - expenses
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0
  const totalExpenses = categories.reduce((s, c) => s + (c.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Deep dive into your spending patterns</p>
        </div>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} title="Total Income" value={fmt(income)} variant="blue" loading={loading} />
        <StatCard icon={TrendingDown} title="Total Expenses" value={fmt(expenses)} variant="red" loading={loading} />
        <StatCard icon={PiggyBank} title="Net Savings" value={fmt(savings)} variant="green" loading={loading} />
        <StatCard icon={Percent} title="Savings Rate" value={`${savingsRate}%`} variant="purple" loading={loading} />
      </div>

      {/* Monthly Bar Chart (12 months) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Income vs Expenses (12 Months)</h2>
        {loading ? (
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : monthly.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(val) => fmt(val)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Breakdown + Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Category Breakdown</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No expense data</div>
          ) : (
            <div className="space-y-3">
              {categories
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .slice(0, 8)
                .map((cat, i) => {
                  const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100) : 0
                  return (
                    <div key={cat.category || i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{cat.category || 'Other'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(cat.total)}</span>
                          {cat.change !== undefined && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cat.change >= 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                              {fmtPct(cat.change)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Spending Trend Line Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Daily Spending Trend</h2>
          {loading ? (
            <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : trends.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No trend data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickFormatter={(d) => {
                    try { return format(new Date(d), 'MMM dd') } catch { return d }
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val) => fmt(val)}
                  labelFormatter={(d) => { try { return format(new Date(d), 'MMM dd, yyyy') } catch { return d } }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Line type="monotone" dataKey="expenses" name="Spending" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
