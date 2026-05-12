import { Outlet, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../store/authStore.js'
import { VaultLogo } from '../components/auth/VaultLogo.jsx'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <VaultLogo className="h-8 w-8" />
            <span className="text-sm font-semibold">VaultX</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-400 sm:inline">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
      >
        <div className="mb-8 flex items-center gap-2 text-indigo-400">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
        <Outlet />
      </motion.main>
    </div>
  )
}
