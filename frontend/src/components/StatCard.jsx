import React from 'react'

const variantStyles = {
  blue: {
    card: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  red: {
    card: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
  },
  green: {
    card: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-300',
  },
  purple: {
    card: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
  },
}

export default function StatCard({ icon: Icon, title, value, change, variant = 'blue', loading = false }) {
  const styles = variantStyles[variant] || variantStyles.blue
  const isPositive = change >= 0

  if (loading) {
    return (
      <div className={`rounded-xl border p-5 ${styles.card} animate-pulse`}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="w-16 h-5 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
        <div className="w-32 h-7 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border p-5 ${styles.card} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && change !== null && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${styles.value}`}>{value}</p>
    </div>
  )
}
