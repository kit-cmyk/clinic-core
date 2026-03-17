import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ResultStatus = 'Available' | 'Pending'

interface LabResult {
  id: string
  testName: string
  date: string
  status: ResultStatus
}

const MOCK_RESULTS: LabResult[] = [
  { id: '1', testName: 'Complete Blood Count', date: '2026-03-10', status: 'Available' },
  { id: '2', testName: 'Lipid Panel', date: '2026-02-28', status: 'Available' },
  { id: '3', testName: 'HbA1c', date: '2026-03-18', status: 'Pending' },
]

export function PortalResultsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">My Lab Results</h1>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {MOCK_RESULTS.map((result) => (
              <li key={result.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{result.testName}</p>
                  <p className="text-sm text-muted-foreground">{result.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={result.status === 'Available' ? 'default' : 'secondary'}>
                    {result.status}
                  </Badge>
                  {result.status === 'Available' && (
                    <Button size="sm" variant="outline" onClick={() => {}}>
                      Download
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
