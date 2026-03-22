import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: unknown
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  const navigate = useNavigate()

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We're sorry — an unexpected error occurred. The issue has been reported automatically.
          </p>
        </div>

        {import.meta.env.DEV && (
          <pre className="text-left text-xs bg-muted rounded-md p-4 overflow-auto max-h-40 text-destructive">
            {message}
            {error instanceof Error && error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => { navigate('/dashboard'); resetError() }}
          >
            Go to Dashboard
          </Button>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  )
}
