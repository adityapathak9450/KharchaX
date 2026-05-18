import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart2,
  Target,
  RefreshCw,
  Users,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Transactions', icon: ArrowLeftRight, path: '/dashboard/transactions' },
      { label: 'Wallets', icon: Wallet, path: '/dashboard/wallets' },
      { label: 'Analytics', icon: BarChart2, path: '/dashboard/analytics' },
    ],
  },
  {
    label: 'PLANNING',
    items: [
      { label: 'Budgets', icon: Target, path: '/dashboard/budgets' },
      { label: 'Recurring', icon: RefreshCw, path: '/dashboard/recurring' },
    ],
  },
  {
    label: 'TEAM',
    items: [
      { label: 'Shared Wallets', icon: Users, path: '/dashboard/shared-wallets' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Reports', icon: FileText, path: '/dashboard/reports' },
      { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
    ],
  },
];

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f0f0f] border-r border-white/[0.08]">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-indigo-400">KharchaX</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">v1.0</span>
        </div>
      </div>
      
      <div className="h-px bg-white/[0.08] mx-6" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-xs font-medium text-gray-500 mb-2 px-3">{group.label}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-3 px-3 py-2 rounded-xl text-sm border-l-2 border-indigo-500 bg-indigo-600/10 text-indigo-400'
                      : 'flex items-center gap-3 px-3 py-2 rounded-xl text-sm border-l-2 border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all'
                  }
                  onClick={isMobile ? onClose : undefined}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Free Plan</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-60 z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: 240 }}
      className="fixed left-0 top-0 h-full w-60 z-30"
    >
      {sidebarContent}
    </motion.div>
  );
};

export default Sidebar;
