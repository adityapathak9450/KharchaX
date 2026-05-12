import { getPasswordStrengthLabel, getPasswordStrengthLevel } from '../../utils/passwordStrength.js'

const bar = (active) =>
  `h-1 flex-1 rounded-full transition-colors ${active ? 'bg-indigo-500' : 'bg-white/10'}`

export function PasswordStrengthMeter({ password }) {
  const level = getPasswordStrengthLevel(password || '')
  const label = getPasswordStrengthLabel(level)
  const colors = {
    1: 'text-rose-400',
    2: 'text-amber-400',
    3: 'text-lime-400',
    4: 'text-emerald-400',
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={bar(i <= level)} />
        ))}
      </div>
      {password && password.length > 0 && (
        <p className={`text-xs font-medium ${colors[level]}`}>{label}</p>
      )}
    </div>
  )
}
