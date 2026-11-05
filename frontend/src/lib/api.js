import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

export default api

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  remove: (id) => api.delete(`/transactions/${id}`),
  importCSV: (formData) =>
    api.post('/transactions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  overrideCategory: (id, category) =>
    api.patch(`/transactions/${id}/category`, { category }),
}

// Analytics API
export const analyticsAPI = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getMonthly: (params) => api.get('/analytics/monthly', { params }),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
}

// AI API
export const aiAPI = {
  getRecommendations: () => api.get('/ai/recommendations'),
  getBudgets: (params) => api.get('/ai/budgets', { params }),
}

// Budgets API
export const budgetsAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  upsert: (data) => api.post('/budgets', data),
  remove: (id) => api.delete(`/budgets/${id}`),
}
