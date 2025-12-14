import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from "sonner";
import { routing } from '@/routing';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import "../globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata = {
  title: "Decentralized Agentic AI Powered Loan Agent | AI-Powered Loan Assistant",
  description: "Get approved in few minutes with our intelligent AI agents. Fast approvals, personalized offers, and seamless verification.",
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
    // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  
  // Enable static rendering
  setRequestLocale(locale);
  
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${geist.className} ${geistMono.className} antialiased dark:selection:text-white dark:selection:bg-red-600`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
