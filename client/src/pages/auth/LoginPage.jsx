import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthShell } from '../../components/auth/AuthShell'
import { FloatingField } from '../../components/auth/FloatingField'
import { useAuthStore } from '../../store/authStore'
import { loginFormSchema } from '../../features/auth/authSchemas'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [showPw, setShowPw] = useState(false)

  const from =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      await login(values.email, values.password)
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.errors?.code ||
        e.message ||
        'Could not sign in'
      toast.error(typeof msg === 'string' ? msg : 'Could not sign in')
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-400">Sign in to continue to your workspace.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          <FloatingField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            register={register('email')}
          />
          <FloatingField
            id="login-password"
            label="Password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.password?.message}
            register={register('password')}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-gray-950 px-3 text-gray-500">or</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400">
          New to VaultX?{' '}
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            Create account
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
