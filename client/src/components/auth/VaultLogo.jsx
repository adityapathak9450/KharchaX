import { useId } from 'react'

export function VaultLogo({ className = 'h-10 w-10' }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `vx-v-${uid}`

  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.06)" />
      <path
        d="M12 10h6l5 10 5-10h6L22 32 12 10z"
        fill={`url(#${gradId})`}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}
