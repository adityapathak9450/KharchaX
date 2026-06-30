import { useState } from 'react'
import { User, Mail, Save } from 'lucide-react'

export function ProfileSection({ user, onUpdate, isPending }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <div className="p-6 rounded-xl card">
      <h2 className="text-lg font-semibold text-foreground mb-6">Profile Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-2.5 input-field rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:bg-elevated transition-all"
              required
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary px-4 py-2.5 text-sm gap-2 disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
