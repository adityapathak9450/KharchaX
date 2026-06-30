import { Lock, Key, Shield, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SecuritySection() {
  return (
    <div className="p-6 rounded-xl card">
      <h2 className="text-lg font-semibold text-foreground mb-6">Security Settings</h2>
      
      <div className="space-y-4">
        {/* Change Password */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Change Password</p>
              <p className="text-xs text-muted">Update your password to keep your account secure</p>
            </div>
          </div>
          <Link
            to="/forgot-password"
            className="px-4 py-2 rounded-lg bg-elevated border border-border text-foreground text-sm hover:bg-elevated transition-all"
          >
            Change
          </Link>
        </div>

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-hover text-muted text-sm cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* Active Sessions */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Active Sessions</p>
              <p className="text-xs text-muted">Manage devices where you're logged in</p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-hover text-muted text-sm cursor-not-allowed"
          >
            Manage
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400 mb-1">Security Tip</p>
            <p className="text-xs text-muted">
              Use a strong, unique password and enable two-factor authentication when available to protect your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
