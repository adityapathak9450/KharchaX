import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, User, Lock, LogOut } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '../../lib/apiClient'
import { useAuthStore } from '../../store/authStore'
import { ProfileSection } from '../../components/settings/ProfileSection'
import { SecuritySection } from '../../components/settings/SecuritySection'
import { PreferencesSection } from '../../components/settings/PreferencesSection'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/', { replace: true })
    }
  }

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.get('/auth/me').then((res) => res.data.data.user),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data) => apiClient.put('/auth/update-profile', data),
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })

  const currentUser = userData || user

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-muted/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-muted" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-gray-400">
              Manage your account preferences
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted hover:text-foreground/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>

                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-8 rounded-xl card">
          <div className="h-8 bg-border rounded w-1/3 mb-4" />
          <div className="h-4 bg-border rounded w-full mb-2" />
          <div className="h-4 bg-border rounded w-2/3 mb-4" />
          <div className="h-8 bg-border rounded w-1/4" />
        </div>
      ) : (
        <>
          {activeTab === 'profile' && (
            <ProfileSection
              user={currentUser}
              onUpdate={(data) => updateProfileMutation.mutate(data)}
              isPending={updateProfileMutation.isPending}
            />
          )}

          {activeTab === 'security' && <SecuritySection />}

          {activeTab === 'preferences' && (
            <PreferencesSection
              user={currentUser}
              onUpdate={(data) => updateProfileMutation.mutate(data)}
              isPending={updateProfileMutation.isPending}
            />
          )}
        </>
      )}

      {/* Danger Zone */}
      <div className="mt-8 p-6 rounded-xl bg-red-500/5 border border-red-500/20">
        <h3 className="text-sm font-medium text-red-400 mb-2">
          Danger Zone
        </h3>

        <p className="text-xs text-gray-400 mb-4">
          Once you log out, you'll need to sign in again to access your account.
        </p>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}