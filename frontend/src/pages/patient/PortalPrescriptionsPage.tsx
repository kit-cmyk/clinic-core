import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type PrescriptionStatus = 'Active' | 'Completed'

interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  status: PrescriptionStatus
}

const MOCK_PRESCRIPTIONS: Prescription[] = [
  { id: '1', medication: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', status: 'Active' },
  { id: '2', medication: 'Metformin', dosage: '1000mg', frequency: 'Once daily', status: 'Active' },
  { id: '3', medication: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', status: 'Completed' },
]

export function PortalPrescriptionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">My Prescriptions</h1>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {MOCK_PRESCRIPTIONS.map((rx) => (
              <li key={rx.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{rx.medication}</p>
                  <p className="text-sm text-muted-foreground">
                    {rx.dosage} — {rx.frequency}
                  </p>
                </div>
                <Badge variant={rx.status === 'Active' ? 'default' : 'secondary'}>
                  {rx.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
