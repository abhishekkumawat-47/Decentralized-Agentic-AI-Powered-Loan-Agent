"use client"

import { Menu, Transition, Disclosure } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/use-auth';
import { LogIn, LogOut, User, ChevronDown, Menu as MenuIcon, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { AnimatedThemeToggler } from './animated-theme-toggler';

const Header = () => {
  const { user, loading, login, logout, isAuthenticated } = useAuth();  
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Apply Now', href: '/en/chat' }
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-lg px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <span className="text-base sm:text-lg font-display font-bold text-primary text-glow-subtle tracking-wider">
                Loan Assistant
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.3, duration: 0.4 }}
                  className="text-xs xl:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group tracking-wide uppercase"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <div className="hidden lg:flex">
                <AnimatedThemeToggler />
              </div>

              {/* Language Switcher */}
              <div className="hidden lg:flex">
                <LanguageSwitcher />
              </div>

              {/* Auth Section - Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : isAuthenticated && user ? (
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="flex items-center gap-2 bg-muted/50 hover:bg-muted/70 text-foreground border border-primary/30 hover:border-primary/60 rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer transition-all">
                      <User className="w-4 h-4 text-primary" />
                      <span className="hidden md:inline max-w-[100px] truncate">
                        {user.name || user.email}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-primary" />
                    </Menu.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right glass-card rounded-lg shadow-lg ring-1 ring-primary/20 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <div className={`${
                                active ? 'bg-primary/10' : ''
                              } px-4 py-2 text-sm text-foreground border-b border-primary/10`}>
                                <div className="font-semibold truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                              </div>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={logout}
                                className={`${
                                  active ? 'bg-primary/10 text-primary' : 'text-foreground'
                                } group cursor-pointer hidden lg:flex w-full items-center gap-2 px-4 py-2 text-sm font-medium transition-colors`}
                              >
                                <LogOut className="w-4 h-4" />
                                Logout
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <motion.button
                    onClick={login}
                    className="hidden lg:flex cursor-pointer items-center gap-1.5 btn-cyber px-4 md:px-6 py-1.5 md:py-2 text-foreground font-display font-bold text-xs md:text-sm uppercase tracking-wider rounded"
                  >
                    <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>Sign In</span>
                  </motion.button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Disclosure as="div" className="lg:hidden">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-muted/70 text-primary border border-primary/30 hover:border-primary/60 transition-all">
                      {open ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <MenuIcon className="w-5 h-5" />
                      )}
                    </Disclosure.Button>

                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel className="absolute left-3 right-3 top-[72px] glass-card bg-background rounded-lg shadow-lg ring-1 ring-primary/20 p-4">
                        {/* Mobile Navigation Links */}
                        <div className="space-y-2 mb-4">
                          {navItems.map((item) => (
                            <Disclosure.Button
                              key={item.label}
                              as="a"
                              href={item.href}
                              className="block px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors uppercase tracking-wide"
                            >
                              {item.label}
                            </Disclosure.Button>
                          ))}
                        </div>

                        {/* Mobile Theme & Language Controls */}
                        <div className="mb-4 px-4 space-y-4">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Theme</div>
                            <AnimatedThemeToggler />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Language</div>
                            <LanguageSwitcher />
                          </div>
                        </div>

                        {/* Mobile Auth Section */}
                        <div className="border-t border-primary/10 pt-4">
                          {loading ? (
                            <div className="flex justify-center">
                              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                          ) : isAuthenticated && user ? (
                            <div className="space-y-2">
                              <div className="px-4 py-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-foreground">
                                  <User className="w-4 h-4 text-primary" />
                                  <div>
                                    <div className="text-sm font-semibold truncate">{user.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={logout}
                                className="w-full cursor-pointer flex items-center justify-center gap-2 btn-cyber px-4 py-2.5 text-foreground font-display font-bold text-sm uppercase tracking-wider rounded"
                              >
                                <LogOut className="w-4 h-4" />
                                Logout
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={login}
                              className="w-full cursor-pointer flex items-center justify-center gap-2 btn-cyber px-4 py-2.5 text-foreground font-display font-bold text-sm uppercase tracking-wider rounded"
                            >
                              <LogIn className="w-4 h-4" />
                              Sign In
                            </button>
                          )}
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;