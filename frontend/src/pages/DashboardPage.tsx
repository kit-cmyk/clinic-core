import { CalendarDays, Users, FlaskConical, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

const STAT_CARDS = [
  {
    title: "Today's Appointments",
    value: '24',
    change: '+4 from yesterday',
    icon: CalendarDays,
    trend: 'up' as const,
  },
  {
    title: 'Active Patients',
    value: '1,284',
    change: '+12 this week',
    icon: Users,
    trend: 'up' as const,
  },
  {
    title: 'Pending Lab Results',
    value: '7',
    change: '3 urgent',
    icon: FlaskConical,
    trend: 'neutral' as const,
  },
  {
    title: 'Outstanding Invoices',
    value: '₱38,450',
    change: '5 overdue',
    icon: Receipt,
    trend: 'down' as const,
  },
]

const RECENT_APPOINTMENTS = [
  { id: '1', patient: 'Maria Santos', time: '09:00', doctor: 'Dr. Reyes', status: 'confirmed' },
  { id: '2', patient: 'Juan dela Cruz', time: '09:30', doctor: 'Dr. Mendoza', status: 'waiting' },
  { id: '3', patient: 'Ana Gonzales', time: '10:00', doctor: 'Dr. Reyes', status: 'confirmed' },
  { id: '4', patient: 'Pedro Bautista', time: '10:30', doctor: 'Dr. Cruz', status: 'cancelled' },
  { id: '5', patient: 'Rosa Lim', time: '11:00', doctor: 'Dr. Mendoza', status: 'confirmed' },
]

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  waiting: 'secondary',
  cancelled: 'destructive',
}

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Good morning, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening at your clinic today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p
                className={[
                  'text-xs mt-1',
                  stat.trend === 'up' && 'text-chart-1',
                  stat.trend === 'down' && 'text-destructive',
                  stat.trend === 'neutral' && 'text-muted-foreground',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {RECENT_APPOINTMENTS.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-xs font-medium">
                      {appt.patient.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{appt.patient}</p>
                    <p className="text-xs text-muted-foreground">{appt.doctor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{appt.time}</span>
                  <Badge variant={STATUS_BADGE[appt.status] ?? 'outline'}>
                    {appt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
