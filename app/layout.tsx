import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/contexts/theme-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "  Decentralized Agentic AI Powered Loan Agent - AI-Powered Loan Assistant",
  description:
    "Get approved in minutes with our intelligent AI agents. Fast approvals, personalized offers, and seamless verification."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased selection:text-white dark:selection:text-white selection:bg-black dark:selection:bg-red-600" style={{ fontFamily: `${_geist.style.fontFamily}, ${_geistMono.style.fontFamily}` }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
