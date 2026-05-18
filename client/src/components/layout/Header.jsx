import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationCenter from '../ui/NotificationCenter';

const Header = ({ onMenuToggle, isMobile }) => {
  const { user } = useAuthStore();

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Menu toggle and Search */}
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions, wallets..."
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all w-64"
            />
          </div>
        </div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationCenter />

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/[0.08]">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
              {getUserInitials()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
