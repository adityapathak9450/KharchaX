import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { VaultLogo } from '../components/auth/VaultLogo'

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gray-950 text-white"
      style={{
        backgroundImage: `radial-gradient(rgba(99, 102, 241, 0.12) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-transparent to-gray-950" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-16 pt-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VaultLogo className="h-9 w-9" />
            <span className="text-sm font-semibold tracking-tight">VaultX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 flex flex-1 flex-col items-start justify-center sm:mt-32"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">Finance OS</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Clarity for every dollar.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg">
            Premium finance management with the polish of Linear and the speed of Vercel. Built for teams who care
            about craft.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </motion.main>
      </div>
    </div>
  )
}
