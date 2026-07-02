import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/', { replace: true });
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full sidebar-shell">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">KharchaX</h1>
      </div>

      <div className="h-px bg-border mx-6" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, i) => (
          <div key={i}>
            <h3 className="text-xs text-gray-500 mb-2 px-3">{group.label}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive ? 'nav-item-active' : 'nav-item'
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
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
            {getUserInitials()}
          </div>

          <div>
            <p className="text-sm text-foreground">{user?.name || 'User'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay (mobile only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="
          fixed top-0 left-0 h-full z-40
          w-[80%] sm:w-72 lg:w-60
          bg-background border-r border-border
        "
      >
        {sidebarContent}
      </motion.div>
    </>
  );
};

export default Sidebar;