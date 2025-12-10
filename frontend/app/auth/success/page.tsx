"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

function AuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get token from URL query parameter
    const token = searchParams.get('token')
    
    if (token) {
      // Store token in localStorage for client-side access
      localStorage.setItem('session_token', token)
      toast.success('Authentication successful')
    } else {
      toast.error('Authentication failed - no token received')
    }
    
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      window.location.href = '/'
    }, 1500)

    return () => clearTimeout(timer)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">Authentication successful</h2>
        <p className="text-muted-foreground mt-2">Redirecting to home...</p>
      </div>
    </div>
  )
}

export default function AuthSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  )
}
