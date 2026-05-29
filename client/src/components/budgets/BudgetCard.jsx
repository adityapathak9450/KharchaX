import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MoreHorizontal,
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
  ShoppingBag,
  HeartPulse,
  Utensils,
  Car,
  Home,
  Gamepad2,
  Plane,
  GraduationCap,
  Briefcase,
  Pencil,
  Trash2,
} from 'lucide-react'

import { formatCurrency } from '../../utils/format.js'

export function BudgetCard({ budget, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const utilizationPercent = budget.utilizationPercent || 0
  const isExceeded = budget.isExceeded || false
  const shouldAlert = budget.shouldAlert || false
  const remaining = budget.amount - budget.spent

  const progressColor = isExceeded
    ? 'bg-red-500'
    : shouldAlert
    ? 'bg-yellow-500'
    : 'bg-green-500'

  const iconMap = {
    'shopping-bag': ShoppingBag,
    'heart-pulse': HeartPulse,
    utensils: Utensils,
    car: Car,
    home: Home,
    gamepad2: Gamepad2,
    plane: Plane,
    'graduation-cap': GraduationCap,
    briefcase: Briefcase,
  }

  const IconComponent = iconMap[budget.category?.icon] || Target

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 backdrop-blur-sm transition-all hover:border-white/20"
    >
      {/* Status badge */}
      {isExceeded && (
        <div className="absolute top-4 right-12">
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-xs text-red-400">Exceeded</span>
          </div>
        </div>
      )}
      {shouldAlert && !isExceeded && (
        <div className="absolute top-4 right-12">
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
            <TrendingUp className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">Alert</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
            style={{ backgroundColor: `${budget.color}20`, color: budget.color }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white leading-tight">{budget.name}</h4>
            <p className="text-xs text-gray-400">
              {budget.category?.name || 'Uncategorized'}
            </p>
          </div>
        </div>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((prev) => !prev)
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              menuOpen
                ? 'bg-white/15 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute right-0 top-8 z-30 w-40 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onEdit(budget)
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                  Edit Budget
                </button>
                <div className="h-px bg-white/10 mx-3" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete(budget)
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  Delete Budget
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span
            className={`font-semibold ${
              isExceeded ? 'text-red-400' : shouldAlert ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {utilizationPercent.toFixed(1)}%
          </span>
        </div>

        <div className="relative">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>
          {budget.alertAt && budget.alertAt < 100 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-yellow-400/50"
              style={{ left: `${budget.alertAt}%` }}
            />
          )}
        </div>
      </div>

      {/* Amount Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Spent</span>
          <span className="text-white font-medium">{formatCurrency(budget.spent)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Budget</span>
          <span className="text-white font-medium">{formatCurrency(budget.amount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
          <span className="text-gray-400">Remaining</span>
          <span className={`font-semibold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {remaining < 0 && '−'}
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && ' over'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/10">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(budget.year, budget.month - 1).toLocaleString('default', {
              month: 'long',
            })}{' '}
            {budget.year}
          </span>
        </div>
        <span>Alert at {budget.alertAt}%</span>
      </div>

      {/* Accent border bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ backgroundColor: budget.color }}
      />
    </motion.div>
  )
}
