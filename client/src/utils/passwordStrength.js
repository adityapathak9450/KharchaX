/** Returns 1–4 for meter segments (weak → very strong) */
export function getPasswordStrengthLevel(password) {
  if (!password || password.length < 6) return 1
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return 1
  if (score <= 4) return 2
  if (score <= 5) return 3
  return 4
}

export function getPasswordStrengthLabel(level) {
  const labels = { 1: 'Weak', 2: 'Fair', 3: 'Strong', 4: 'Very strong' }
  return labels[level] || ''
}
