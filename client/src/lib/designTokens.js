/** Semantic status & chart colors — fixed accents (not theme-dependent) */
export const STATUS = {
  income: '#10B981',
  expense: '#EF4444',
  savings: '#6366f1',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}

export const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
]

export const PALETTE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
]

export const DEFAULT_ACCENT = '#6366f1'

export const TRANSACTION_TYPE_STYLES = {
  income: { color: '#4ade80' },
  expense: { color: '#f87171' },
}

export function categoryBadgeStyle(color) {
  const c = color || DEFAULT_ACCENT
  return {
    background: `${c}20`,
    border: `1px solid ${c}30`,
    color: c,
  }
}
