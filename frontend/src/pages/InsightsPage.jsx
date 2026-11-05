import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Brain, AlertTriangle, Info, TrendingDown, Lightbulb } from 'lucide-react'
import { aiAPI } from '../lib/api'
import toast from 'react-hot-toast'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const priorityConfig = {
  high: { label: 'High Priority', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  medium: { label: 'Medium', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  low: { label: 'Low', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', dot: 'bg-green-500' },
}

const FALLBACK_RECOMMENDATIONS = [
  { title: 'Track Your Daily Expenses', description: 'Consistently logging transactions helps identify unnecessary spending patterns. Even small purchases add up over time.', priority: 'high', category: 'Budgeting', potentialSaving: 0 },
  { title: 'Build an Emergency Fund', description: 'Aim to save 3-6 months of living expenses. Start with a goal of $1,000 and gradually increase it.', priority: 'high', category: 'Savings', potentialSaving: 0 },
  { title: 'Reduce Dining Out Expenses', description: 'Cooking at home more often can significantly reduce your food budget. Try meal prepping to save time and money.', priority: 'medium', category: 'Food', potentialSaving: 150 },
  { title: 'Review Subscriptions', description: 'Audit all your recurring subscriptions. Cancel services you haven\'t used in the past month.', priority: 'medium', category: 'Bills', potentialSaving: 50 },
  { title: 'Set a Monthly Budget', description: 'Create spending limits for each category. Use the Budgets page to set targets and track progress.', priority: 'low', category: 'Planning', potentialSaving: 0 },
]

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
      <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )
}

function RecommendationCard({ rec }) {
  const priority = priorityConfig[rec.priority] || priorityConfig.low
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priority.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        {rec.category && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {rec.category}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{rec.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{rec.description}</p>
      {rec.potentialSaving > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
          <TrendingDown className="w-4 h-4" />
          Potential saving: {fmt(rec.potentialSaving)}/month
        </div>
      )}
    </div>
  )
}

export default function InsightsPage() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setIsFallback(false)
    try {
      const res = await aiAPI.getRecommendations()
      const data = res.data?.recommendations || res.data?.data || res.data || []
      if (Array.isArray(data) && data.length > 0) {
        setRecommendations(data)
      } else {
        setRecommendations(FALLBACK_RECOMMENDATIONS)
        setIsFallback(true)
      }
      setLastUpdated(new Date())
    } catch {
      setRecommendations(FALLBACK_RECOMMENDATIONS)
      setIsFallback(true)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecommendations() }, [fetchRecommendations])

  const highCount = recommendations.filter((r) => r.priority === 'high').length
  const medCount = recommendations.filter((r) => r.priority === 'medium').length
  const totalSaving = recommendations.reduce((s, r) => s + (r.potentialSaving || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Financial Advisor</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personalized insights powered by AI analysis of your spending habits
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Insights
        </button>
      </div>

      {/* Fallback Notice */}
      {isFallback && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Using rule-based analysis</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              AI recommendations unavailable. Showing general financial best practices.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">High Priority</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{highCount}</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">items need attention</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Suggestions</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{medCount}</p>
            <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-0.5">optimization opportunities</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{fmt(totalSaving)}</p>
            <p className="text-xs text-green-500 dark:text-green-400 mt-0.5">per month if followed</p>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {lastUpdated && !loading && (
        <p className="text-xs text-gray-400 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
