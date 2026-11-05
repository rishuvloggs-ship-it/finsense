import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finsense_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('finsense_token')
      localStorage.removeItem('finsense_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Demo fallback data for preview deployment (e.g. Vercel without standalone backend)
const DEMO_USER = { id: 1, name: 'Alex Johnson', email: 'demo@finsense.io' }

const DEMO_TRANSACTIONS = [
  { id: 1, description: 'Tech Corp Monthly Salary', amount: 5200, type: 'income', category: 'Salary', paymentMethod: 'bank', date: new Date().toISOString(), confidence: 0.99, aiCategorized: true },
  { id: 2, description: 'Monthly Apartment Rent', amount: 1650, type: 'expense', category: 'Rent', paymentMethod: 'bank', date: new Date(Date.now() - 86400000 * 2).toISOString(), confidence: 0.98, aiCategorized: true },
  { id: 3, description: 'Whole Foods Market', amount: 142.80, type: 'expense', category: 'Food', paymentMethod: 'card', date: new Date(Date.now() - 86400000 * 3).toISOString(), confidence: 0.95, aiCategorized: true },
  { id: 4, description: 'Uber Transit Ride', amount: 24.50, type: 'expense', category: 'Transport', paymentMethod: 'card', date: new Date(Date.now() - 86400000 * 4).toISOString(), confidence: 0.96, aiCategorized: true },
  { id: 5, description: 'Netflix 4K Streaming', amount: 22.99, type: 'expense', category: 'Entertainment', paymentMethod: 'card', date: new Date(Date.now() - 86400000 * 5).toISOString(), confidence: 0.99, aiCategorized: true },
  { id: 6, description: 'Amazon Home Essentials', amount: 88.20, type: 'expense', category: 'Shopping', paymentMethod: 'card', date: new Date(Date.now() - 86400000 * 6).toISOString(), confidence: 0.94, aiCategorized: true },
  { id: 7, description: 'City Electric Utility Bill', amount: 110.00, type: 'expense', category: 'Bills', paymentMethod: 'card', date: new Date(Date.now() - 86400000 * 8).toISOString(), confidence: 0.97, aiCategorized: true },
  { id: 8, description: 'Equinox Gym Membership', amount: 120.00, type: 'expense', category: 'Health', paymentMethod: 'card', date: new Date(Date.now() - 86400000 * 10).toISOString(), confidence: 0.95, aiCategorized: true },
]

const DEMO_MONTHLY = [
  { month: "Jun '26", income: 5200, expenses: 2600, net: 2600 },
  { month: "Jul '26", income: 5400, expenses: 2900, net: 2500 },
  { month: "Aug '26", income: 5200, expenses: 2750, net: 2450 },
  { month: "Sep '26", income: 5800, expenses: 3100, net: 2700 },
  { month: "Oct '26", income: 5200, expenses: 2850, net: 2350 },
  { month: "Nov '26", income: 5200, expenses: 2450, net: 2750 },
]

const DEMO_CATEGORIES = [
  { category: 'Rent', amount: 1650, total: 1650, percentage: 55.4 },
  { category: 'Food', amount: 480, total: 480, percentage: 16.1 },
  { category: 'Bills', amount: 240, total: 240, percentage: 8.1 },
  { category: 'Transport', amount: 195, total: 195, percentage: 6.5 },
  { category: 'Shopping', amount: 180, total: 180, percentage: 6.0 },
  { category: 'Entertainment', amount: 125, total: 125, percentage: 4.2 },
  { category: 'Health', amount: 110, total: 110, percentage: 3.7 },
]

const DEMO_RECOMMENDATIONS = [
  { title: 'Maintain Strong Savings Rate', description: 'Your savings rate of ~45% is excellent and well above the recommended 20% benchmark.', priority: 'high', category: 'Savings', potentialSaving: 0 },
  { title: 'Optimize Food & Dining', description: 'Food accounted for $480 this month. Meal prepping can save an estimated $120/month.', priority: 'medium', category: 'Food', potentialSaving: 120 },
  { title: 'Review Digital Subscriptions', description: 'Audit entertainment services to eliminate unused streaming channels.', priority: 'low', category: 'Entertainment', potentialSaving: 25 },
  { title: 'Automate Emergency Fund Contributions', description: 'Transfer $300 to a high-yield liquid emergency savings account on payday.', priority: 'high', category: 'Savings', potentialSaving: 0 },
  { title: 'Set Category Spending Caps', description: 'Use the Budgets page to establish firm monthly limits for Shopping and Dining.', priority: 'medium', category: 'Budgeting', potentialSaving: 80 },
]

const DEMO_BUDGETS = [
  { id: 1, category: 'Food', amount: 600, spent: 480, remaining: 120, percentUsed: 80 },
  { id: 2, category: 'Rent', amount: 1700, spent: 1650, remaining: 50, percentUsed: 97 },
  { id: 3, category: 'Transport', amount: 250, spent: 195, remaining: 55, percentUsed: 78 },
  { id: 4, category: 'Shopping', amount: 300, spent: 180, remaining: 120, percentUsed: 60 },
  { id: 5, category: 'Bills', amount: 250, spent: 240, remaining: 10, percentUsed: 96 },
  { id: 6, category: 'Entertainment', amount: 150, spent: 125, remaining: 25, percentUsed: 83 },
  { id: 7, category: 'Health', amount: 200, spent: 110, remaining: 90, percentUsed: 55 },
]

async function safeCall(apiPromise, fallbackData) {
  try {
    return await apiPromise
  } catch (err) {
    if (!err.response) {
      // Backend offline or unreachable — return demo data seamlessly
      return { data: fallbackData }
    }
    throw err
  }
}

export default api

// Auth API with graceful offline demo support
export const authAPI = {
  login: async (data) => {
    try {
      return await api.post('/auth/login', data)
    } catch (err) {
      if (!err.response) {
        return { data: { token: 'demo-jwt-token-preview', user: DEMO_USER } }
      }
      throw err
    }
  },
  register: async (data) => {
    try {
      return await api.post('/auth/register', data)
    } catch (err) {
      if (!err.response) {
        return { data: { token: 'demo-jwt-token-preview', user: { id: 2, name: data.name, email: data.email } } }
      }
      throw err
    }
  },
  me: async () => {
    try {
      return await api.get('/auth/me')
    } catch (err) {
      if (!err.response) {
        return { data: { user: DEMO_USER } }
      }
      throw err
    }
  },
}

// Transactions API
export const transactionsAPI = {
  getAll: (params) =>
    safeCall(api.get('/transactions', { params }), {
      transactions: DEMO_TRANSACTIONS,
      total: DEMO_TRANSACTIONS.length,
      page: 1,
      totalPages: 1,
    }),
  create: (data) =>
    safeCall(api.post('/transactions', data), {
      ...data,
      id: Date.now(),
      confidence: 0.95,
      aiCategorized: true,
    }),
  update: (id, data) => safeCall(api.put(`/transactions/${id}`, data), { id, ...data }),
  remove: (id) => safeCall(api.delete(`/transactions/${id}`), { message: 'Deleted' }),
  importCSV: (formData) =>
    safeCall(
      api.post('/transactions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { imported: 8, errors: [] }
    ),
  overrideCategory: (id, category) =>
    safeCall(api.patch(`/transactions/${id}/category`, { category }), { id, category }),
}

// Analytics API
export const analyticsAPI = {
  getSummary: (params) =>
    safeCall(api.get('/analytics/summary', { params }), {
      totalIncome: 5200,
      totalExpenses: 2850,
      netSavings: 2350,
      savingsRate: 45.2,
      transactionCount: DEMO_TRANSACTIONS.length,
    }),
  getMonthly: (params) => safeCall(api.get('/analytics/monthly', { params }), DEMO_MONTHLY),
  getCategories: (params) =>
    safeCall(api.get('/analytics/categories', { params }), {
      categories: DEMO_CATEGORIES,
      data: DEMO_CATEGORIES,
      total: 2850,
    }),
  getTrends: (params) =>
    safeCall(
      api.get('/analytics/trends', { params }),
      DEMO_TRANSACTIONS.map((t) => ({ date: t.date.split('T')[0], expenses: t.amount, income: 0, net: -t.amount }))
    ),
}

// AI API
export const aiAPI = {
  getRecommendations: () =>
    safeCall(api.get('/ai/recommendations'), {
      recommendations: DEMO_RECOMMENDATIONS,
    }),
  getBudgets: (params) =>
    safeCall(api.get('/ai/budgets', { params }), {
      budgets: DEMO_BUDGETS,
    }),
}

// Budgets API
export const budgetsAPI = {
  getAll: (params) =>
    safeCall(api.get('/budgets', { params }), {
      budgets: DEMO_BUDGETS,
      data: DEMO_BUDGETS,
    }),
  upsert: (data) => safeCall(api.post('/budgets', data), { ...data, id: Date.now() }),
  remove: (id) => safeCall(api.delete(`/budgets/${id}`), { message: 'Deleted' }),
}
