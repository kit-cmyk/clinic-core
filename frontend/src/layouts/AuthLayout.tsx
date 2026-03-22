import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
}

function DecorativePanel() {
  return (
    <div
      className="hidden lg:block lg:w-[52%] relative overflow-hidden rounded-3xl m-4"
      style={{
        background:
          'linear-gradient(140deg, #6ee7b7 0%, #34d399 18%, #10b981 36%, #2dd4bf 52%, #a7f3d0 70%, #d1fae5 85%, #6ee7b7 100%)',
      }}
    >
      {/* Atmospheric glow layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 28% 72%, rgba(180,240,160,0.38) 0%, transparent 52%), radial-gradient(ellipse at 74% 24%, rgba(20,180,160,0.36) 0%, transparent 52%)',
        }}
      />

      {/* Subtle medical cross */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="155" y="60" width="90" height="280" rx="18" fill="white" />
        <rect x="60" y="155" width="280" height="90" rx="18" fill="white" />
      </svg>

      {/* Large main sphere */}
      <div
        className="absolute"
        style={{
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 36% 33%, rgba(240,255,250,0.95) 0%, rgba(167,243,208,0.96) 28%, rgba(52,211,153,0.97) 58%, rgba(16,185,129,1) 80%, rgba(5,150,105,1) 100%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow:
            '0 32px 100px rgba(16,185,129,0.28), inset 0 -10px 36px rgba(5,120,80,0.15)',
        }}
      />

      {/* Small floating sphere */}
      <div
        className="absolute"
        style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 34% 30%, rgba(245,255,252,0.97) 0%, rgba(167,243,208,0.97) 44%, rgba(45,212,191,1) 100%)',
          top: '21%',
          right: '27%',
          boxShadow: '0 10px 34px rgba(20,184,166,0.28)',
        }}
      />
    </div>
  )
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-100/80 dark:bg-zinc-900">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-h-screen">
        {/* Top nav */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-foreground">ClinicAlly</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            New to ClinicAlly?{' '}
            <Link
              to="/register"
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              Register
            </Link>
          </p>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 shrink-0">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ClinicAlly
          </p>
        </div>
      </div>

      {/* Right decorative gradient panel */}
      <DecorativePanel />
    </div>
  )
}
