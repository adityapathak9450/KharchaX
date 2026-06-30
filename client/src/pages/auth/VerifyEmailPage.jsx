import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell.jsx'
import api from '../../lib/axios.js'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email
  const [digits, setDigits] = useState(() => Array(6).fill(''))
  const inputsRef = useRef([])
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      toast.error('Start from registration to verify your email')
      navigate('/register', { replace: true })
    }
  }, [email, navigate])

  const setDigit = useCallback((index, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = v
      return next
    })
    if (v && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }, [])

  const handlePaste = (e) => {
    e.preventDefault()
    const raw = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (raw.length === 0) return
    const next = Array(6).fill('')
    for (let i = 0; i < raw.length; i++) next[i] = raw[i]
    setDigits(next)
    const focusIdx = Math.min(raw.length, 5)
    inputsRef.current[focusIdx]?.focus()
  }

  const code = digits.join('')

  const submit = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/verify-email', { token: code })
      if (!data.success) throw new Error(data.message || 'Verification failed')
      toast.success('Email verified — you can sign in')
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid code'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0 || !email) return
    try {
      const { data } = await api.post('/auth/resend-verification', { email })
      if (!data.success) throw new Error(data.message)
      toast.success('A new code has been sent')
      setCooldown(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend')
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  if (!email) return null

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Verify your email</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a 6-digit code to <span className="font-medium text-foreground/90">{email}</span>
        </p>

        <div className="mt-10 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digits[i] && i > 0) {
                  inputsRef.current[i - 1]?.focus()
                }
              }}
              className="h-12 w-10 rounded-xl border border-border bg-surface shadow-sm text-center text-lg font-semibold text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-ring/40 sm:h-14 sm:w-12"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={submit}
          disabled={submitting || code.length !== 6}
          whileTap={{ scale: 0.98 }}
          className="mt-10 btn-primary w-full py-3 text-sm gap-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Verify
        </motion.button>

        <p className="mt-8 text-center text-sm text-muted">
          Didn&apos;t receive it?{' '}
          <button
            type="button"
            disabled={cooldown > 0}
            onClick={resend}
            className="font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="text-muted hover:text-foreground">
            Back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
