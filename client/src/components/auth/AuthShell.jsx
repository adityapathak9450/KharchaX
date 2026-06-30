import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { VaultLogo } from './VaultLogo.jsx'

const dotGridStyle = {
  backgroundImage: 'radial-gradient(rgb(var(--color-primary) / 0.12) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
}

export function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-foreground" style={dotGridStyle}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-canvas" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8 sm:px-6">
        <header className="mb-10 flex shrink-0 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <VaultLogo className="h-9 w-9" />
            <span className="text-sm font-semibold tracking-tight">VaultX</span>
          </Link>
        </header>
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col justify-center pb-12"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
