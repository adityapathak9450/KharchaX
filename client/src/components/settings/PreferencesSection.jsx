import { useState } from 'react'
import { Globe, Bell, Moon, Sun, Save } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function PreferencesSection({ user, onUpdate, isPending }) {
  const { theme, toggleTheme } = useThemeStore()
  const [formData, setFormData] = useState({
    currency: user?.currency || 'INR',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: true,
  })

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate({ currency: formData.currency })
  }

  return (
    <div className="p-6 rounded-xl card">
      <h2 className="text-lg font-semibold text-foreground mb-6">Preferences</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Default Currency</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-surface transition-all appearance-none cursor-pointer"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Timezone</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={formData.timezone}
              disabled
              className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-muted cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-muted mt-1">Automatically detected from your browser</p>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-elevated border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted">Receive updates about your account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
            className={`w-12 h-6 rounded-full transition-all ${
              formData.notifications ? 'bg-primary' : 'bg-muted/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-surface shadow-sm transition-all ${
                formData.notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-elevated border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted">Use dark theme across the app</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-all ${
              theme === 'dark' ? 'bg-primary' : 'bg-muted/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-surface shadow-sm transition-all ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
