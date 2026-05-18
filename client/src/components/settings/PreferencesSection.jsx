import { useState } from 'react'
import { Globe, Bell, Moon, Sun, Save } from 'lucide-react'

export function PreferencesSection({ user, onUpdate, isPending }) {
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
    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
      <h2 className="text-lg font-semibold text-white mb-6">Preferences</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Default Currency</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={formData.timezone}
              disabled
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Automatically detected from your browser</p>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive updates about your account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
            className={`w-12 h-6 rounded-full transition-all ${
              formData.notifications ? 'bg-indigo-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-all ${
                formData.notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dark Mode</p>
              <p className="text-xs text-gray-500">Use dark theme across the app</p>
            </div>
          </div>
          <button
            type="button"
            className="w-12 h-6 rounded-full bg-indigo-500 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-white transition-all translate-x-6" />
          </button>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
