import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationCenter from '../ui/NotificationCenter';

const Header = ({ onMenuToggle }) => {
  const { user } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* LEFT */}
        <div className="flex items-center gap-4">
          
          {/* MENU BUTTON (ALWAYS visible) */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <NotificationCenter />

          <div className="text-sm text-white">
            {user?.name || 'User'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;