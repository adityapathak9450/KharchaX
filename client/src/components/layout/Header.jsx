import React from 'react';
import { Menu, Search, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { motion } from 'framer-motion';
import NotificationCenter from '../ui/NotificationCenter';

const Header = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 navbar-shell">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* LEFT */}
        <div className="flex items-center gap-4">
          
          {/* MENU BUTTON (ALWAYS visible) */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors focus-ring"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 input-field rounded-xl text-sm"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors focus-ring"
            whileTap={{ scale: 0.95 }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </motion.div>
          </motion.button>

          <NotificationCenter />

          <div className="text-sm text-foreground">
            {user?.name || 'User'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;