"use client"

import { useTheme } from '@/contexts/theme-context';
import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    // Add transitioning class
    document.documentElement.classList.add('theme-transitioning');
    
    // Toggle theme
    toggleTheme();
    
    // Remove transitioning class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 800);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted/70 border border-primary/30 hover:border-primary/60 transition-all group"
      aria-label="Toggle theme"
    >
      {/* Sun icon for light mode */}
      <Sun 
        className={`absolute w-5 h-5 text-primary transition-all duration-500 ${
          theme === 'light' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      
      {/* Moon icon for dark mode */}
      <Moon 
        className={`absolute w-5 h-5 text-primary transition-all duration-500 ${
          theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
