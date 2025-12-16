"use client"

import { useTheme } from '@/contexts/theme-context';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnimatedThemeToggler() {
  const { theme, toggleTheme } = useTheme();

const handleToggle = () => {
  const root = document.documentElement;

  // Cover screen
  root.classList.add('theme-transitioning');

  // Swap theme while covered
  setTimeout(() => {
    toggleTheme();
  }, 600);

  // Release animation
  setTimeout(() => {
    root.classList.add('theme-release');
  }, 700);

  // Cleanup
  setTimeout(() => {
    root.classList.remove('theme-transitioning', 'theme-release');
  }, 1200);
};



  return (
    <motion.button
      onClick={handleToggle}
      className="relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/70 border border-primary/30 hover:border-primary/60 transition-all group overflow-hidden"
      aria-label="Toggle theme"
    >
      

      {/* Sun icon for light mode */}
      <motion.div
        animate={{
          rotate: theme === 'light' ? 0 : 90,
          scale: theme === 'light' ? 1 : 0,
          opacity: theme === 'light' ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        className="absolute"
      >
        <Sun className="w-5 h-5 text-primary" />
      </motion.div>
      
      {/* Moon icon for dark mode */}
      <motion.div
        animate={{
          rotate: theme === 'dark' ? 0 : -90,
          scale: theme === 'dark' ? 1 : 0,
          opacity: theme === 'dark' ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        className="absolute"
      >
        <Moon className="w-5 h-5 text-primary" />
      </motion.div>
    </motion.button>
  );
}
