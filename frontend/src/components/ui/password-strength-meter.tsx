import { cn } from '@/lib/utils'

type StrengthLabel = 'Weak' | 'Fair' | 'Strong'

interface StrengthResult {
  score: 0 | 1 | 2
  label: StrengthLabel
}

export function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: 'Weak' }
  let met = 0
  if (password.length >= 12) met++
  if (/[A-Z]/.test(password)) met++
  if (/[a-z]/.test(password)) met++
  if (/[0-9]/.test(password)) met++
  if (/[^A-Za-z0-9]/.test(password)) met++
  if (met >= 4) return { score: 2, label: 'Strong' }
  if (met >= 2) return { score: 1, label: 'Fair' }
  return { score: 0, label: 'Weak' }
}

const SEGMENT_COLORS = ['bg-destructive', 'bg-amber-500', 'bg-green-500'] as const
const LABEL_COLORS   = ['text-destructive', 'text-amber-600', 'text-green-600'] as const

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null

  const { score, label } = getPasswordStrength(password)

  return (
    <div
      role="meter"
      aria-label="Password strength"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={2}
      aria-valuetext={label}
      className="space-y-1 pt-1"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-200',
              i <= score ? SEGMENT_COLORS[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', LABEL_COLORS[score])}>{label}</p>
    </div>
  )
}
