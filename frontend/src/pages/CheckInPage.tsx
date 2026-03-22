import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CalendarX } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRow } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'
import { toast } from 'sonner'

type CheckInStatus = 'Scheduled' | 'Checked In' | 'No Show'

interface CheckInAppointment {
  id: string
  time: string
  patientName: string
  professional: string
  type: string
  status: CheckInStatus
}

function apiStatusToDisplay(status: string): CheckInStatus {
  if (status === 'CHECKED_IN' || status === 'checked_in') return 'Checked In'
  if (status === 'NO_SHOW' || status === 'no_show') return 'No Show'
  return 'Scheduled'
}

function statusBadgeVariant(status: CheckInStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Checked In') return 'default'
  if (status === 'No Show') return 'destructive'
  return 'outline'
}

export function CheckInPage() {
  const { user } = useAuthStore()
  const isSecretary =
    !user || user.role === 'receptionist' || user.role === 'branch_manager' || user.role === 'org_admin'

  const today = new Date().toISOString().substring(0, 10)

  const [appointments, setAppointments] = useState<CheckInAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [noShowId, setNoShowId] = useState<string | null>(null)
  const [noShowReason, setNoShowReason] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [apptRes, profRes] = await Promise.all([
        api.get('/api/v1/appointments', { params: { limit: 200 } }),
        api.get('/api/v1/professionals'),
      ])

      const profMap = new Map<string, string>()
      ;(profRes.data.data as Record<string, unknown>[]).forEach(p => {
        const u = p.user as { firstName: string; lastName: string } | undefined
        profMap.set(String(p.id), u ? `${u.firstName} ${u.lastName}`.trim() : 'Unknown')
      })

      const mapped: CheckInAppointment[] = (apptRes.data.data as Record<string, unknown>[])
        .filter(a => String(a.scheduledAt).substring(0, 10) === today)
        .filter(a => {
          const s = String(a.status).toUpperCase()
          return s !== 'COMPLETED' && s !== 'CANCELLED'
        })
        .map(a => {
          const d = new Date(String(a.scheduledAt))
          return {
            id:           String(a.id),
            time:         `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
            patientName:  (() => {
              const p = a.patient as { firstName: string; lastName: string } | undefined
              return p ? `${p.firstName} ${p.lastName}`.trim() : 'Unknown Patient'
            })(),
            professional: profMap.get(String(a.professionalId)) ?? 'Unknown',
            type:         String(a.type),
            status:       apiStatusToDisplay(String(a.status)),
          }
        })
        .sort((a, b) => a.time.localeCompare(b.time))

      setAppointments(mapped)
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCheckIn = async (id: string) => {
    try {
      await api.post(`/api/v1/appointments/${id}/check-in`)
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'Checked In' } : a),
      )
      toast.success('Patient checked in')
    } catch {
      toast.error('Check-in failed')
    }
    setConfirmId(null)
  }

  const handleNoShow = async (id: string) => {
    try {
      await api.put(`/api/v1/appointments/${id}`, { status: 'NO_SHOW' })
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'No Show' } : a),
      )
      toast.success('Marked as no show')
    } catch {
      toast.error('Failed to update status')
    }
    setNoShowId(null)
    setNoShowReason('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Patient Check-In</h1>
        <p className="text-sm text-muted-foreground">Today — {today}</p>
      </div>

      {!isSecretary && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">Check-in management is only available to reception staff.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <EmptyState
          icon={CalendarX}
          heading="No appointments today"
          subtext="Today's appointment list is empty."
        />
      )}

      {!loading && (
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
      )}
    </div>
  )
}
