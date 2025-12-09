"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { Bot, Loader2 } from "lucide-react"

interface AgentToastProps {
  message: string
  isVisible: boolean
}

export function AgentToast({ message, isVisible }: AgentToastProps) {
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (toastRef.current) {
      if (isVisible) {
        gsap.fromTo(
          toastRef.current,
          { y: -20, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
        )
      } else {
        gsap.to(toastRef.current, {
          y: -20,
          opacity: 0,
          scale: 0.9,
          duration: 0.3,
        })
      }
    }
  }, [isVisible])

  if (!isVisible && !message) return null

  return (
    <div
      ref={toastRef}
      className="flex items-center gap-3 px-4 py-3 bg-card border border-primary/30 rounded-xl shadow-lg"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm text-foreground">{message}</span>
      <Loader2 className="w-4 h-4 text-primary animate-spin" />
    </div>
  )
}
