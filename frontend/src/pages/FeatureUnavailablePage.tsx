import { Construction } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function FeatureUnavailablePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Construction className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">This feature isn't available yet</p>
        <p className="text-sm text-muted-foreground">We're working on it. Check back soon.</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </div>
  )
}
