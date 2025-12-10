import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
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
      <body className={`${_geist.className} ${_geistMono.className} antialiased dark:selection:text-white dark:selection:bg-red-600`}>
          {children}
          <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
