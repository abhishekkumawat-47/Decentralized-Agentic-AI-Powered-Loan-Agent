"use client"

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/use-auth';
import { LogIn, LogOut, User } from 'lucide-react';

const Header = () => {
  const { user, loading, login, logout, isAuthenticated, refreshUser } = useAuth();  
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Apply Now', href: '/chat' }
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-lg px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <span className="text-base sm:text-lg font-display font-bold text-primary text-glow-subtle tracking-wider sm:block">
              Loan Assistant
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.3, duration: 0.4 }}
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group tracking-wide uppercase"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 shadow-[0_0_10px_hsl(0_100%_50%)]" />
              </motion.a>
            ))}
          </nav>

          {/* CTA Button / Auth Section */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* User Profile */}
                <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted/50">
                  <User className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-foreground max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </div>
                
                {/* Logout Button */}
                <motion.button
                  onClick={logout}
                  className="flex items-center gap-1.5 cursor-pointer sm:gap-2 btn-cyber px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-foreground font-display font-bold text-xs sm:text-sm uppercase tracking-wider rounded"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={login}
                className="flex items-center gap-1.5 cursor-pointer sm:gap-2 btn-cyber px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-foreground font-display font-bold text-xs sm:text-sm uppercase tracking-wider rounded"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;