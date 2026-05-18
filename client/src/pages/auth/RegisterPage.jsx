import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { AuthShell } from '../../components/auth/AuthShell'
import { FloatingField } from '../../components/auth/FloatingField'
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter'
import { useAuthStore } from '../../store/authStore'
import { registerFormSchema } from '../../features/auth/authSchemas'

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const password = watch('password')

  const onSubmit = async (values) => {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      toast.success('Check your email for a verification code')
      navigate('/verify-email', { state: { email: values.email } })
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-gray-400">Start managing finances with VaultX in minutes.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          <FloatingField
            id="reg-name"
            label="Full name"
            autoComplete="name"
            error={errors.name?.message}
            register={register('name')}
          />
          <FloatingField
            id="reg-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            register={register('email')}
          />
          <div>
            <FloatingField
              id="reg-password"
              label="Password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
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
            <div className="mt-3">
              <PasswordStrengthMeter password={password} />
            </div>
          </div>
          <FloatingField
            id="reg-confirm"
            label="Confirm password"
            type={showPw2 ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            register={register('confirmPassword')}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={showPw2 ? 'Hide password' : 'Show password'}
              >
                {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Controller
            name="terms"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(ev) => field.onChange(ev.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/40"
                />
                <span>
                  I agree to the{' '}
                  <span className="text-indigo-400">Terms of Service</span> and{' '}
                  <span className="text-indigo-400">Privacy Policy</span>
                </span>
              </label>
            )}
          />
          {errors.terms ? <p className="text-xs text-rose-400">{errors.terms.message}</p> : null}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Creating account…' : 'Create account'}
          </motion.button>
        </form>

        <p className="mt-10 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
