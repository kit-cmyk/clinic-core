import { useState, useMemo, useEffect } from 'react'
import { CalendarDays, Users, FlaskConical, Receipt, Stethoscope, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { PatientForm, MOCK_PATIENTS } from '@/components/patients/PatientForm'
import type { Patient } from '@/types'

// ── Shared mock data ───────────────────────────────────────────────────────────

const PROFESSIONALS = [
  { id: 'p1', name: 'Dr. Sarah Kim',    specialization: 'General Medicine', colorIdx: 0, slotMins: 30 },
  { id: 'p2', name: 'Dr. James Park',   specialization: 'Cardiology',        colorIdx: 1, slotMins: 45 },
  { id: 'p3', name: 'Dr. Liu Wei',      specialization: 'Pediatrics',        colorIdx: 2, slotMins: 30 },
  { id: 'p4', name: 'Nurse Ana Santos', specialization: 'General Nursing',   colorIdx: 3, slotMins: 20 },
  { id: 'p5', name: 'Dr. Priya Nair',   specialization: 'Dermatology',       colorIdx: 4, slotMins: 30 },
]

// Weekday schedule per professional: 0=Mon … 6=Sun
const PROF_SCHEDULES = [
  { professionalId: 'p1', weekday: 0, startTime: '08:00', endTime: '17:00' },
  { professionalId: 'p1', weekday: 1, startTime: '08:00', endTime: '17:00' },
  { professionalId: 'p1', weekday: 2, startTime: '08:00', endTime: '17:00' },
  { professionalId: 'p1', weekday: 3, startTime: '08:00', endTime: '17:00' },
  { professionalId: 'p1', weekday: 4, startTime: '08:00', endTime: '13:00' },
  { professionalId: 'p2', weekday: 0, startTime: '09:00', endTime: '17:00' },
  { professionalId: 'p2', weekday: 2, startTime: '09:00', endTime: '17:00' },
  { professionalId: 'p2', weekday: 4, startTime: '09:00', endTime: '17:00' },
  { professionalId: 'p3', weekday: 1, startTime: '08:00', endTime: '17:00' },
  { professionalId: 'p3', weekday: 3, startTime: '08:00', endTime: '17:00' },
  { professionalId: 'p4', weekday: 0, startTime: '07:00', endTime: '15:00' },
  { professionalId: 'p4', weekday: 2, startTime: '07:00', endTime: '15:00' },
  { professionalId: 'p4', weekday: 4, startTime: '07:00', endTime: '15:00' },
  { professionalId: 'p5', weekday: 1, startTime: '10:00', endTime: '18:00' },
  { professionalId: 'p5', weekday: 3, startTime: '10:00', endTime: '18:00' },
]

const TODAY_APPTS = [
  { id: 'a10', patientName: 'John Doe',       professionalId: 'p1', status: 'booked' as const },
  { id: 'a11', patientName: 'Jane Smith',     professionalId: 'p2', status: 'booked' as const },
  { id: 'a12', patientName: 'Carlos Rivera',  professionalId: 'p3', status: 'booked' as const },
  { id: 'a13', patientName: 'Priya Sharma',   professionalId: 'p4', status: 'booked' as const },
  { id: 'a14', patientName: 'Aisha Patel',    professionalId: 'p5', status: 'booked' as const },
  { id: 'a15', patientName: 'Tom Wilson',     professionalId: 'p1', status: 'booked' as const },
]

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Lab Review', 'New Patient', 'Emergency']

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Mon=0, Sun=6
function toWeekday(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

function generateSlots(startTime: string, endTime: string, slotMins: number): string[] {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  const slots: string[] = []
  while (cur + slotMins <= end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    cur += slotMins
  }
  return slots
}

// ── Stat cards ────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { title: "Today's Appointments", value: '24', change: '+4 from yesterday', icon: CalendarDays, trend: 'up' as const },
  { title: 'Active Patients',      value: '1,284', change: '+12 this week', icon: Users,        trend: 'up' as const },
  { title: 'Pending Lab Results',  value: '7',  change: '3 urgent',        icon: FlaskConical, trend: 'neutral' as const },
  { title: 'Outstanding Invoices', value: '₱38,450', change: '5 overdue', icon: Receipt,      trend: 'down' as const },
]

// ── Book Appointment Sheet ─────────────────────────────────────────────────────

interface BookApptForm {
  patientId: string
  patientName: string
  professionalId: string
  date: string
  startTime: string
  durationMins: number
  type: string
}

function BookAppointmentSheet({
  open,
  onClose,
  prefillProfId,
}: {
  open: boolean
  onClose: () => void
  prefillProfId?: string
}) {
  const [patients,        setPatients]        = useState<Patient[]>(MOCK_PATIENTS)
  const [patientSearch,   setPatientSearch]   = useState('')
  const [patientDropOpen, setPatientDropOpen] = useState(false)
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [success,         setSuccess]         = useState(false)

  const [form, setForm] = useState<BookApptForm>({
    patientId: '',
    patientName: '',
    professionalId: prefillProfId ?? PROFESSIONALS[0].id,
    date: fmt(new Date()),
    startTime: '',
    durationMins: PROFESSIONALS[0].slotMins,
    type: APPOINTMENT_TYPES[0],
  })

  // Derived: weekday of selected date (Mon=0)
  const dateWeekday = useMemo(() => {
    if (!form.date) return -1
    return toWeekday(new Date(form.date + 'T00:00:00'))
  }, [form.date])

  // Derived: prof object for selected professionalId
  const selectedProf = PROFESSIONALS.find(p => p.id === form.professionalId)

  // Derived: available slots for the selected professional + date
  const availableSlots = useMemo(() => {
    if (!selectedProf) return []
    const sched = PROF_SCHEDULES.find(
      s => s.professionalId === selectedProf.id && s.weekday === dateWeekday
    )
    if (!sched) return []
    return generateSlots(sched.startTime, sched.endTime, selectedProf.slotMins)
  }, [selectedProf, dateWeekday])

  // Reset form when sheet opens
  useEffect(() => {
    if (!open) return
    const profId = prefillProfId ?? PROFESSIONALS[0].id
    const prof = PROFESSIONALS.find(p => p.id === profId)
    const today = fmt(new Date())
    const wd = toWeekday(new Date())
    const sched = PROF_SCHEDULES.find(s => s.professionalId === profId && s.weekday === wd)
    const slots = sched && prof ? generateSlots(sched.startTime, sched.endTime, prof.slotMins) : []
    setForm({
      patientId: '',
      patientName: '',
      professionalId: profId,
      date: today,
      startTime: slots[0] ?? '',
      durationMins: prof?.slotMins ?? 30,
      type: APPOINTMENT_TYPES[0],
    })
    setPatientSearch('')
    setSuccess(false)
  }, [open, prefillProfId])

  // Update startTime when slots change
  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(form.startTime)) {
      setForm(f => ({ ...f, startTime: availableSlots[0] }))
    } else if (availableSlots.length === 0) {
      setForm(f => ({ ...f, startTime: '' }))
    }
  }, [availableSlots]) // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(() => {
    const q = patientSearch.toLowerCase().trim()
    return patients.filter(p => !q || p.fullName.toLowerCase().includes(q) || (p.phone ?? '').includes(q)).slice(0, 6)
  }, [patients, patientSearch])

  const selectPatient = (p: Patient) => {
    setForm(f => ({ ...f, patientId: p.id, patientName: p.fullName }))
    setPatientSearch(p.fullName)
    setPatientDropOpen(false)
  }

  const handleNewPatient = (p: Patient) => {
    setPatients(prev => [...prev, p])
    selectPatient(p)
    setShowPatientForm(false)
  }

  const handleProfessionalChange = (profId: string) => {
    const prof = PROFESSIONALS.find(p => p.id === profId)
    const wd = toWeekday(new Date(form.date + 'T00:00:00'))
    const sched = PROF_SCHEDULES.find(s => s.professionalId === profId && s.weekday === wd)
    const slots = sched && prof ? generateSlots(sched.startTime, sched.endTime, prof.slotMins) : []
    setForm(f => ({
      ...f,
      professionalId: profId,
      durationMins: prof?.slotMins ?? f.durationMins,
      startTime: slots[0] ?? '',
    }))
  }

  const handleDateChange = (date: string) => {
    const wd = toWeekday(new Date(date + 'T00:00:00'))
    const sched = PROF_SCHEDULES.find(s => s.professionalId === form.professionalId && s.weekday === wd)
    const slots = sched && selectedProf ? generateSlots(sched.startTime, sched.endTime, selectedProf.slotMins) : []
    setForm(f => ({ ...f, date, startTime: slots[0] ?? '' }))
  }

  const handleSubmit = () => {
    if (!form.patientName.trim() || !form.startTime) return
    setSuccess(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={o => !o && onClose()}>
        <SheetContent>
          <SheetHeader><SheetTitle>Book Appointment</SheetTitle></SheetHeader>
          {success ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 px-4 py-16 text-center">
              <p className="text-base font-semibold text-green-600">Appointment Booked!</p>
              <p className="text-sm text-muted-foreground">
                {form.patientName} · {form.date} at {form.startTime}
              </p>
              <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 space-y-4 mt-2">
                {/* Patient combobox */}
                <div className="space-y-1 relative">
                  <Label className="text-xs">Patient</Label>
                  <Input
                    placeholder="Search by name or phone…"
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value)
                      setForm(f => ({ ...f, patientId: '', patientName: e.target.value }))
                      setPatientDropOpen(true)
                    }}
                    onFocus={() => setPatientDropOpen(true)}
                    aria-label="Search patient"
                  />
                  {patientDropOpen && (
                    <div className="absolute z-50 w-full bg-background border rounded-md shadow-lg mt-0.5 max-h-48 overflow-y-auto">
                      {suggestions.map(p => (
                        <button key={p.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between"
                          onMouseDown={e => { e.preventDefault(); selectPatient(p) }}>
                          <span>{p.fullName}</span>
                          <span className="text-xs text-muted-foreground">{p.phone}</span>
                        </button>
                      ))}
                      <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-muted/50 border-t"
                        onMouseDown={e => { e.preventDefault(); setPatientDropOpen(false); setShowPatientForm(true) }}>
                        + Create new patient{patientSearch ? `: "${patientSearch}"` : ''}
                      </button>
                    </div>
                  )}
                </div>

                {/* Professional */}
                <div className="space-y-1">
                  <Label className="text-xs">Professional</Label>
                  <select
                    aria-label="Professional"
                    className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                    value={form.professionalId}
                    onChange={e => handleProfessionalChange(e.target.value)}
                  >
                    {PROFESSIONALS.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.slotMins} min slots</option>
                    ))}
                  </select>
                </div>

                {/* Date + Time Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={e => handleDateChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Time Slot</Label>
                    {availableSlots.length > 0 ? (
                      <select
                        aria-label="Time slot"
                        className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                        value={form.startTime}
                        onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      >
                        {availableSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="border rounded-md px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                        No availability on this date
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      aria-label="Type"
                      className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    >
                      {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (mins)</Label>
                    <Input
                      type="number"
                      min={15}
                      step={5}
                      value={form.durationMins}
                      onChange={e => setForm(f => ({ ...f, durationMins: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="mt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!form.patientName.trim() || !form.startTime}
                >
                  Book Appointment
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
      <PatientForm open={showPatientForm} onClose={() => setShowPatientForm(false)} onSave={handleNewPatient} />
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth()
  const canBook = user?.role === 'receptionist' || user?.role === 'branch_manager' || user?.role === 'org_admin' || !user

  const [bookOpen,      setBookOpen]      = useState(false)
  const [prefillProfId, setPrefillProfId] = useState<string | undefined>(undefined)

  const todayWd = toWeekday(new Date())
  const profAvailability = PROFESSIONALS.map(p => ({
    ...p,
    available: PROF_SCHEDULES.some(s => s.professionalId === p.id && s.weekday === todayWd),
    todayApptCount: TODAY_APPTS.filter(a => a.professionalId === p.id).length,
  }))

  const openBook = (profId?: string) => { setPrefillProfId(profId); setBookOpen(true) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Good morning, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening at your clinic today.
          </p>
        </div>
        {canBook && (
          <Button onClick={() => openBook()} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className={[
                'text-xs mt-1',
                stat.trend === 'up' && 'text-chart-1',
                stat.trend === 'down' && 'text-destructive',
                stat.trend === 'neutral' && 'text-muted-foreground',
              ].filter(Boolean).join(' ')}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {TODAY_APPTS.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-medium">{appt.patientName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{PROFESSIONALS.find(p => p.id === appt.professionalId)?.name}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="capitalize text-xs">{appt.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Professionals available today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Professionals Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {profAvailability.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-6 py-3 transition-colors ${canBook ? 'cursor-pointer hover:bg-muted/40' : ''}`}
                  onClick={() => canBook && openBook(p.id)}
                  role={canBook ? 'button' : undefined}
                  aria-label={canBook ? `Book appointment with ${p.name}` : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-medium">{p.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.specialization} · {p.slotMins} min slots</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.todayApptCount > 0 && (
                      <span className="text-xs text-muted-foreground">{p.todayApptCount} appt{p.todayApptCount !== 1 ? 's' : ''}</span>
                    )}
                    <Badge variant={p.available ? 'default' : 'secondary'} className="text-xs">
                      {p.available ? 'Available' : 'Off today'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <BookAppointmentSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        prefillProfId={prefillProfId}
      />
    </div>
  )
}

export default DashboardPage
