import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('finsense_token'))
  const [loading, setLoading] = useState(true)

  const verifyToken = useCallback(async () => {
    const storedToken = localStorage.getItem('finsense_token')
    if (!storedToken) {
      setLoading(false)
      return
    }
    try {
      const res = await authAPI.me()
      setUser(res.data.user || res.data)
      setToken(storedToken)
    } catch {
      localStorage.removeItem('finsense_token')
      localStorage.removeItem('finsense_user')
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifyToken()
  }, [verifyToken])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('finsense_token', newToken)
    localStorage.setItem('finsense_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('finsense_token', newToken)
    localStorage.setItem('finsense_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    localStorage.removeItem('finsense_token')
    localStorage.removeItem('finsense_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
