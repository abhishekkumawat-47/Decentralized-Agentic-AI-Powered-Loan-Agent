"use client"

import { useTheme } from "@/contexts/theme-context"
import { Sun, Moon, Menu, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const iconRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { y: -100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
    }
  }, [])

  const handleToggle = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 360,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(iconRef.current, { rotation: 0 })
        },
      })
    }
    toggleTheme()
  }

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">  Decentralized Loan Agent
</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-foreground/80 hover:text-foreground transition-colors">
              Home
            </a>
            <a href="#services" className="text-foreground/80 hover:text-foreground transition-colors">
              Services
            </a>
            <a href="#about" className="text-foreground/80 hover:text-foreground transition-colors">
              About
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="hidden sm:inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Apply Now
            </Link>

            <button
              ref={iconRef}
              onClick={handleToggle}
              className="p-2 rounded-xl cursor-pointer bg-card hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>

            <button className="md:hidden p-2 rounded-xl bg-card" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <a href="#home" className="text-foreground/80 hover:text-foreground">
                Home
              </a>
              <a href="#services" className="text-foreground/80 hover:text-foreground">
                Services
              </a>
              <a href="#about" className="text-foreground/80 hover:text-foreground">
                About
              </a>
              <Link href="/chat" className="text-primary font-medium">
                Apply Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
