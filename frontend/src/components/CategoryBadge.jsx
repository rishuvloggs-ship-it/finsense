import React from 'react'

const categoryColors = {
  Food: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  Rent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Transport: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Shopping: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Bills: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  Entertainment: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  Health: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Education: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  Travel: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  Salary: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  Investments: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  Other: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

export default function CategoryBadge({ category }) {
  const colorClass = categoryColors[category] || categoryColors.Other
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {category || 'Other'}
    </span>
  )
}

export { categoryColors }
