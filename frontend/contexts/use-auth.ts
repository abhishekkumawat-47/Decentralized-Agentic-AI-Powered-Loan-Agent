"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name?: string
  picture?: string
  created_at?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Add a small delay to ensure localStorage is ready after redirect
    const timer = setTimeout(() => {
      fetchUser()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const fetchUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null
      
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      
      const response = await fetch(`${API_URL}/user`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        setUser(null)
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session_token')
        }
      } else {
        setError('Failed to fetch user')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }

  const login = () => {
    window.location.href = `${API_URL}/auth/login`
  }

  const logout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null
      
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
      
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token')
      }
      
      setUser(null)
      toast.success('Logged out successfully')
      
      // Redirect to home page after logout
      window.location.href = '/'
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('Failed to logout. Please try again.')
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }
}
