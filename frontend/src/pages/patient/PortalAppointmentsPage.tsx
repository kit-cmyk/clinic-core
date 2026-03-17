import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type ApptStatus = 'Scheduled' | 'Completed' | 'Cancelled'

interface Appointment {
  id: string
  date: string
  time: string
  doctor: string
  type: string
  status: ApptStatus
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', date: '2026-03-22', time: '10:00 AM', doctor: 'Dr. Sarah Kim', type: 'Consultation', status: 'Scheduled' },
  { id: '2', date: '2026-03-10', time: '2:30 PM', doctor: 'Dr. James Park', type: 'Follow-up', status: 'Completed' },
  { id: '3', date: '2026-02-28', time: '9:00 AM', doctor: 'Dr. Sarah Kim', type: 'Lab', status: 'Completed' },
  { id: '4', date: '2026-02-15', time: '11:00 AM', doctor: 'Dr. James Park', type: 'Consultation', status: 'Cancelled' },
]

const STATUS_VARIANT: Record<ApptStatus, 'default' | 'secondary' | 'destructive'> = {
  Scheduled: 'default',
  Completed: 'secondary',
  Cancelled: 'destructive',
}

export function PortalAppointmentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">My Appointments</h1>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Doctor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_APPOINTMENTS.map((appt) => (
                <tr key={appt.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{appt.date}</td>
                  <td className="px-4 py-3">{appt.time}</td>
                  <td className="px-4 py-3">{appt.doctor}</td>
                  <td className="px-4 py-3">{appt.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
