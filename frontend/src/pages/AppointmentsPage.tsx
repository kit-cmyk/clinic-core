import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'

type ViewMode = 'Day' | 'Week'

interface Appointment {
  id: string
  time: string
  patientName: string
  type: string
  status: 'Booked' | 'Available'
  day?: string // for week view
}

// Stub mock data — replace at real API integration
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', time: '08:30', patientName: 'John Doe', type: 'Consultation', status: 'Booked' },
  { id: 'a2', time: '09:00', patientName: 'Jane Smith', type: 'Follow-up', status: 'Booked' },
  { id: 'a3', time: '10:30', patientName: 'Carlos Rivera', type: 'Lab Review', status: 'Booked' },
  { id: 'a4', time: '14:00', patientName: 'Aisha Patel', type: 'New Patient', status: 'Booked' },
]

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Lab Review', 'New Patient', 'Emergency']

// Generate 30-min time slots 08:00–17:00
function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h < 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

const TIME_SLOTS = generateSlots()

// Week view: mock appointment counts per day
const WEEK_DATA = [
  { day: 'Mon', date: '2026-03-16', count: 5 },
  { day: 'Tue', date: '2026-03-17', count: 3 },
  { day: 'Wed', date: '2026-03-18', count: 7 },
  { day: 'Thu', date: '2026-03-19', count: 2 },
  { day: 'Fri', date: '2026-03-20', count: 4 },
  { day: 'Sat', date: '2026-03-21', count: 1 },
  { day: 'Sun', date: '2026-03-22', count: 0 },
]

export function AppointmentsPage() {
  const { user } = useAuthStore()
  const isSecretary = user?.role === 'receptionist' || user?.role === 'branch_manager' || !user

  const [view, setView] = useState<ViewMode>('Day')
  const [bookingSlot, setBookingSlot] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS)

  // Booking form state
  const [bookPatientName, setBookPatientName] = useState('')
  const [bookType, setBookType] = useState(APPOINTMENT_TYPES[0])

  const bookedTimes = new Set(appointments.map((a) => a.time))

  const handleBook = () => {
    if (!bookingSlot || !bookPatientName.trim()) return
    setAppointments((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, time: bookingSlot, patientName: bookPatientName, type: bookType, status: 'Booked' },
    ])
    setBookingSlot(null)
    setBookPatientName('')
    setBookType(APPOINTMENT_TYPES[0])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <div className="flex gap-1 border rounded-md p-1 bg-muted/40">
          {(['Day', 'Week'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                view === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Day View */}
      {view === 'Day' && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">Today — Wednesday, 2026-03-18</p>
          {TIME_SLOTS.map((slot) => {
            const appt = appointments.find((a) => a.time === slot)
            const isBooked = bookedTimes.has(slot)
            const isBookingThis = bookingSlot === slot

            return (
              <div key={slot}>
                <div className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground w-12 shrink-0 font-mono">{slot}</span>
                  {isBooked && appt ? (
                    <Card className="flex-1">
                      <CardContent className="p-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{appt.patientName}</p>
                          <p className="text-xs text-muted-foreground">{appt.type}</p>
                        </div>
                        <Badge variant="default">Booked</Badge>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Available</span>
                      {isSecretary && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => setBookingSlot(isBookingThis ? null : slot)}
                        >
                          {isBookingThis ? 'Cancel' : 'Book'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline booking form */}
                {isBookingThis && (
                  <Card className="ml-15 mb-2">
                    <CardContent className="p-3 space-y-3">
                      <p className="text-sm font-medium">Book Appointment at {slot}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="book-patient">Patient Name</Label>
                          <Input
                            id="book-patient"
                            value={bookPatientName}
                            onChange={(e) => setBookPatientName(e.target.value)}
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="book-type">Appointment Type</Label>
                          <select
                            id="book-type"
                            aria-label="Appointment Type"
                            className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                            value={bookType}
                            onChange={(e) => setBookType(e.target.value)}
                          >
                            {APPOINTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleBook}>Confirm Booking</Button>
                        <Button size="sm" variant="outline" onClick={() => setBookingSlot(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Week View */}
      {view === 'Week' && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Week of 2026-03-16 to 2026-03-22</p>
          <div className="grid grid-cols-7 gap-2">
            {WEEK_DATA.map(({ day, date, count }) => (
              <Card key={day}>
                <CardContent className="p-3 flex flex-col items-center gap-2">
                  <p className="text-sm font-semibold">{day}</p>
                  <p className="text-xs text-muted-foreground">{date.slice(5)}</p>
                  <Badge variant={count > 0 ? 'default' : 'secondary'}>
                    {count}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{count === 1 ? 'appt' : 'appts'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
