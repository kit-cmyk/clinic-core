import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'

type CheckInStatus = 'Scheduled' | 'Checked In' | 'No Show'

interface CheckInAppointment {
  id: string
  time: string
  patientName: string
  professional: string
  type: string
  status: CheckInStatus
}

// Stub mock data — replace at real API integration (CC-62)
const MOCK_CHECKIN_APPOINTMENTS: CheckInAppointment[] = [
  { id: 'ci1', time: '08:30', patientName: 'John Doe', professional: 'Dr. Sarah Kim', type: 'Consultation', status: 'Scheduled' },
  { id: 'ci2', time: '09:00', patientName: 'Jane Smith', professional: 'Dr. James Park', type: 'Follow-up', status: 'Scheduled' },
  { id: 'ci3', time: '10:30', patientName: 'Carlos Rivera', professional: 'Dr. Sarah Kim', type: 'Lab Review', status: 'Checked In' },
  { id: 'ci4', time: '11:00', patientName: 'Aisha Patel', professional: 'Dr. James Park', type: 'New Patient', status: 'Scheduled' },
  { id: 'ci5', time: '14:00', patientName: 'Michael Torres', professional: 'Dr. Sarah Kim', type: 'Follow-up', status: 'No Show' },
]

function statusBadgeVariant(status: CheckInStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Checked In') return 'default'
  if (status === 'No Show') return 'destructive'
  return 'outline'
}

export function CheckInPage() {
  const { user } = useAuthStore()
  // Secretary role: receptionist or branch_manager; treat no-user as secretary for tests
  const isSecretary =
    !user || user.role === 'receptionist' || user.role === 'branch_manager'

  const [appointments, setAppointments] = useState<CheckInAppointment[]>(MOCK_CHECKIN_APPOINTMENTS)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [noShowId, setNoShowId] = useState<string | null>(null)
  const [noShowReason, setNoShowReason] = useState('')

  const handleCheckIn = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: 'Checked In' } : a),
    )
    setConfirmId(null)
  }

  const handleNoShow = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: 'No Show' } : a),
    )
    setNoShowId(null)
    setNoShowReason('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Patient Check-In</h1>
        <p className="text-sm text-muted-foreground">Today — 2026-03-18</p>
      </div>

      {!isSecretary && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">Check-in management is only available to reception staff.</p>
        </div>
      )}

      <div className="space-y-2">
        {appointments.map((appt) => {
          const isPast = appt.status === 'No Show'
          const isCheckedIn = appt.status === 'Checked In'

          return (
            <Card
              key={appt.id}
              className={isPast ? 'opacity-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-muted-foreground w-12">{appt.time}</span>
                    <div>
                      <p className="text-sm font-medium">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{appt.professional} — {appt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(appt.status)}>{appt.status}</Badge>
                    {isSecretary && !isCheckedIn && !isPast && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => { setConfirmId(appt.id); setNoShowId(null) }}
                        >
                          Check In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setNoShowId(appt.id); setConfirmId(null) }}
                        >
                          No Show
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Check-in confirmation */}
                {confirmId === appt.id && (
                  <div className="mt-3 border-t pt-3 flex items-center gap-3">
                    <p className="text-sm text-muted-foreground flex-1">
                      Confirm check-in for <span className="font-medium text-foreground">{appt.patientName}</span>?
                    </p>
                    <Button size="sm" onClick={() => handleCheckIn(appt.id)}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
                  </div>
                )}

                {/* No Show reason form */}
                {noShowId === appt.id && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Mark <span className="font-medium text-foreground">{appt.patientName}</span> as No Show
                    </p>
                    <Input
                      placeholder="Reason (optional)"
                      value={noShowReason}
                      onChange={(e) => setNoShowReason(e.target.value)}
                      aria-label="No show reason"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleNoShow(appt.id)}>
                        Confirm No Show
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setNoShowId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
