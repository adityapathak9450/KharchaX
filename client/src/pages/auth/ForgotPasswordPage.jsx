import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, CheckCircle2 } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { FloatingField } from '../../components/auth/FloatingField'
import api from '../../lib/axios'
import { forgotPasswordFormSchema } from '../../features/auth/authSchemas'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      if (!data.success) throw new Error(data.message)
      setSent(true)
      toast.success('Check your inbox')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Something went wrong')
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="mx-auto w-full max-w-md text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-600/10"
          >
            <CheckCircle2 className="h-12 w-12 text-indigo-400" strokeWidth={1.5} />
          </motion.div>
          <h1 className="mt-8 text-2xl font-semibold text-white">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            If an account exists for that address, we&apos;ve sent a reset link. It may take a minute to arrive.
          </p>
          <div className="mt-10 flex justify-center">
            <div className="rounded-full border border-white/10 bg-white/5 p-6">
              <Mail className="h-10 w-10 text-indigo-400/90" strokeWidth={1.25} />
            </div>
          </div>
          <Link
            to="/login"
            className="mt-12 inline-block text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            ← Back to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Forgot password</h1>
        <p className="mt-2 text-sm text-gray-400">We&apos;ll email you a link to reset your password.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          <FloatingField
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            register={register('email')}
          />
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </motion.button>
        </form>

        <p className="mt-10 text-center text-sm text-gray-400">
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
