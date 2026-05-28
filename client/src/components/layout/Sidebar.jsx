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

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

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
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-400">KharchaX</h1>
      </div>

      <div className="h-px bg-white/[0.08] mx-6" />

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, i) => (
          <div key={i}>
            <h3 className="text-xs text-gray-500 mb-2 px-3">{group.label}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-3 px-3 py-2 text-sm border-l-2 border-indigo-500 bg-indigo-600/10 text-indigo-400'
                      : 'flex items-center gap-3 px-3 py-2 text-sm border-l-2 border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
            {getUserInitials()}
          </div>
          <div>
            <p className="text-sm text-white">{user?.name || 'User'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click outside */}
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{type: "tween",ease: "easeOut",duration: 0.25}}
            className="fixed top-0 left-0 h-full w-60 z-40"
          >
            {sidebarContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;