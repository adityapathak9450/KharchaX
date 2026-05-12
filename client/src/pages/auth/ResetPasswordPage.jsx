import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell.jsx'
import { FloatingField } from '../../components/auth/FloatingField.jsx'
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter.jsx'
import api from '../../lib/axios.js'
import { resetPasswordFormSchema } from '../../features/auth/authSchemas.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const pw = watch('newPassword')

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset link')
    }
  }, [token])

  useEffect(() => {
    if (!done) return undefined
    if (countdown <= 0) {
      navigate('/login', { replace: true })
      return undefined
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [done, countdown, navigate])

  const onSubmit = async ({ newPassword }) => {
    if (!token) return
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword })
      if (!data.success) throw new Error(data.message)
      toast.success('Password updated')
      setDone(true)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reset failed')
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <div className="mx-auto max-w-md text-center">
          <p className="text-gray-400">This reset link is invalid.</p>
          <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-indigo-400">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell>
        <div className="mx-auto max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10"
          >
            <h1 className="text-xl font-semibold text-white">Password updated</h1>
            <p className="mt-2 text-sm text-gray-400">
              Redirecting to sign in in <span className="font-mono text-indigo-300">{countdown}</span>s…
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
              Go to login now
            </Link>
          </motion.div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Set new password</h1>
        <p className="mt-2 text-sm text-gray-400">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          <div>
            <FloatingField
              id="reset-pw"
              label="New password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.newPassword?.message}
              register={register('newPassword')}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="mt-3">
              <PasswordStrengthMeter password={pw} />
            </div>
          </div>
          <FloatingField
            id="reset-pw2"
            label="Confirm password"
            type={showPw2 ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            register={register('confirmPassword')}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Toggle password"
              >
                {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update password
          </motion.button>
        </form>
      </div>
    </AuthShell>
  )
}
