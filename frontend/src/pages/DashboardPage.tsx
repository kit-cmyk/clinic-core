import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, FlaskConical, Receipt, Stethoscope, Plus,
  UserCheck, UserPlus, Clock, ChevronRight, ClipboardCheck,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PatientForm, MOCK_PATIENTS } from '@/components/patients/PatientForm'
import type { Patient, Role } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

type AppointmentStatus = 'booked' | 'confirmed' | 'checked-in' | 'completed' | 'no-show'

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

// Expanded with times and mixed statuses for CC-111/CC-112/CC-117
const TODAY_APPTS: {
  id: string
  patientName: string
  professionalId: string
  status: AppointmentStatus
  startTime: string
  arrivedAt: string | null
}[] = [
  { id: 'a10', patientName: 'John Doe',       professionalId: 'p1', status: 'completed',  startTime: '08:00', arrivedAt: null },
  { id: 'a11', patientName: 'Jane Smith',     professionalId: 'p2', status: 'checked-in', startTime: '09:00', arrivedAt: '08:52' },
  { id: 'a12', patientName: 'Carlos Rivera',  professionalId: 'p3', status: 'confirmed',  startTime: '09:30', arrivedAt: null },
  { id: 'a13', patientName: 'Priya Sharma',   professionalId: 'p4', status: 'checked-in', startTime: '09:40', arrivedAt: '09:35' },
  { id: 'a14', patientName: 'Aisha Patel',    professionalId: 'p5', status: 'booked',     startTime: '10:30', arrivedAt: null },
  { id: 'a15', patientName: 'Tom Wilson',     professionalId: 'p1', status: 'booked',     startTime: '11:00', arrivedAt: null },
  { id: 'a16', patientName: 'Maria Lopez',    professionalId: 'p2', status: 'no-show',    startTime: '11:30', arrivedAt: null },
  { id: 'a17', patientName: 'David Chen',     professionalId: 'p3', status: 'booked',     startTime: '13:00', arrivedAt: null },
]

// Pending actions mock data for CC-113
const PENDING_ACTIONS: { label: string; count: number; href: string; roles: Role[] }[] = [
  { label: 'lab results to publish', count: 3,  href: '/lab/publish', roles: ['lab_technician', 'org_admin', 'branch_manager', 'doctor'] },
  { label: 'prescriptions to sign',  count: 2,  href: '/patients',    roles: ['doctor'] },
  { label: 'invoices unpaid',        count: 5,  href: '/billing',     roles: ['receptionist', 'org_admin', 'branch_manager'] },
]

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Lab Review', 'New Patient', 'Emergency']

// ── Utility helpers ────────────────────────────────────────────────────────────

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

/** Minutes between two HH:MM strings. Positive if b > a. */
function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (bh * 60 + bm) - (ah * 60 + am)
}

// ── Status colour helpers ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  completed:  'bg-emerald-500',
  'checked-in': 'bg-amber-400',
  confirmed:  'bg-blue-500',
  booked:     'bg-slate-400',
  'no-show':  'bg-destructive',
}

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed:    'default',
  'checked-in': 'default',
  confirmed:    'secondary',
  booked:       'outline',
  'no-show':    'destructive',
}

// ── Stat cards ────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { title: "Today's Appointments", value: '24',      change: '+4 from yesterday', icon: CalendarDays, trend: 'up' as const },
  { title: 'Active Patients',      value: '1,284',   change: '+12 this week',    icon: Users,        trend: 'up' as const },
  { title: 'Pending Lab Results',  value: '7',       change: '3 urgent',         icon: FlaskConical, trend: 'neutral' as const },
  { title: 'Outstanding Invoices', value: '₱38,450', change: '5 overdue',        icon: Receipt,      trend: 'down' as const },
]

// ── CC-117: Appointment Status Breakdown Bar ───────────────────────────────────

function AppointmentStatusBar({ appts }: { appts: typeof TODAY_APPTS }) {
  const total = appts.length
  if (total === 0) return null

  const counts = appts.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {} as Record<AppointmentStatus, number>)

  const segments: { status: AppointmentStatus; pct: number; count: number }[] =
    (['completed', 'checked-in', 'confirmed', 'booked', 'no-show'] as AppointmentStatus[])
      .filter(s => (counts[s] ?? 0) > 0)
      .map(s => ({ status: s, count: counts[s], pct: (counts[s] / total) * 100 }))

  return (
    <div className="px-6 pb-3">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {segments.map(seg => (
          <div
            key={seg.status}
            className={cn('h-full', STATUS_COLORS[seg.status])}
            style={{ width: `${seg.pct}%` }}
            title={`${seg.count} ${seg.status}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {segments.map(seg => (
          <span key={seg.status} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_COLORS[seg.status])} />
            {seg.count} {seg.status}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── CC-114: Slot Utilization Bar ──────────────────────────────────────────────

function SlotUtilizationBar({ totalSlots, bookedSlots }: { totalSlots: number; bookedSlots: number }) {
  if (totalSlots === 0) return null
  const pct = Math.round((bookedSlots / totalSlots) * 100)
  const barColor = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'

  return (
    <div className="mt-1.5">
      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% utilised · {bookedSlots}/{totalSlots} slots</p>
    </div>
  )
}

// ── CC-111: Appointment Timeline Strip ────────────────────────────────────────

function AppointmentTimeline({ appts }: { appts: typeof TODAY_APPTS }) {
  const sorted = [...appts].sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Today's Timeline</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No appointments scheduled.</p></CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Today's Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[52px] top-2 bottom-2 w-px bg-border" />

          {sorted.map((appt, i) => {
            const prev = sorted[i - 1]
            const gap = prev ? minutesBetween(prev.startTime, appt.startTime) : 0
            const prof = PROFESSIONALS.find(p => p.id === appt.professionalId)

            return (
              <div key={appt.id}>
                {/* Gap indicator */}
                {gap > 60 && (
                  <div className="flex items-center gap-2 pl-[68px] py-1">
                    <span className="text-[10px] text-muted-foreground/60 italic">{gap} min gap</span>
                  </div>
                )}
                <div className="flex items-start gap-3 py-1.5">
                  {/* Time */}
                  <span className="text-xs text-muted-foreground w-12 shrink-0 text-right pt-0.5 tabular-nums">
                    {appt.startTime}
                  </span>
                  {/* Dot */}
                  <div className={cn('h-3 w-3 rounded-full mt-1 shrink-0 ring-2 ring-background z-10', STATUS_COLORS[appt.status])} />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{appt.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{prof?.name}</p>
                  </div>
                  <Badge
                    variant={STATUS_BADGE_VARIANT[appt.status]}
                    className="text-[10px] capitalize shrink-0"
                  >
                    {appt.status}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── CC-112: Check-In Queue ────────────────────────────────────────────────────

function CheckInQueue({ appts }: { appts: typeof TODAY_APPTS }) {
  // Mock current time as 10:15 for demo purposes
  const NOW = '10:15'
  const queue = appts
    .filter(a => a.status === 'checked-in' && a.arrivedAt)
    .sort((a, b) => (a.arrivedAt ?? '').localeCompare(b.arrivedAt ?? ''))

  const waitMins = (arrivedAt: string) => minutesBetween(arrivedAt, NOW)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          Check-In Queue
          {queue.length > 0 && (
            <Badge variant="default" className="text-xs ml-auto">{queue.length} waiting</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-4">No patients currently waiting.</p>
        ) : (
          <div className="divide-y divide-border">
            {queue.map(appt => {
              const prof = PROFESSIONALS.find(p => p.id === appt.professionalId)
              const wait = waitMins(appt.arrivedAt!)
              return (
                <div key={appt.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-amber-700 text-xs font-medium">{appt.patientName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{prof?.name} · appt {appt.startTime}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-semibold', wait > 30 ? 'text-destructive' : wait > 15 ? 'text-amber-600' : 'text-emerald-600')}>
                      {wait}m wait
                    </p>
                    <p className="text-xs text-muted-foreground">arrived {appt.arrivedAt}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── CC-113: Pending Actions Bar ────────────────────────────────────────────────

function PendingActionsBar({ role }: { role: Role }) {
  const navigate = useNavigate()
  const visible = PENDING_ACTIONS.filter(a => a.roles.includes(role) && a.count > 0)
  if (visible.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">Pending:</span>
      {visible.map(action => (
        <button
          key={action.label}
          onClick={() => navigate(action.href)}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <span className="h-4 w-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold">{action.count}</span>
          {action.label}
          <ChevronRight className="h-3 w-3 opacity-60" />
        </button>
      ))}
    </div>
  )
}

// ── CC-115: Quick-Action Bar ──────────────────────────────────────────────────

interface QuickAction {
  label: string
  icon: React.ElementType
  roles: Role[]
  action: 'book' | 'checkin' | 'addpatient' | 'lab' | 'invoice'
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'New Appointment',   icon: CalendarDays,    roles: ['receptionist', 'branch_manager', 'org_admin'],                                  action: 'book' },
  { label: 'Check-In Patient',  icon: UserCheck,       roles: ['receptionist', 'branch_manager', 'org_admin', 'nurse'],                        action: 'checkin' },
  { label: 'Add Patient',       icon: UserPlus,        roles: ['receptionist', 'branch_manager', 'org_admin', 'nurse'],                        action: 'addpatient' },
  { label: 'Publish Lab Result',icon: FlaskConical,    roles: ['lab_technician', 'org_admin', 'branch_manager'],                               action: 'lab' },
  { label: 'New Invoice',       icon: Receipt,         roles: ['receptionist', 'org_admin', 'branch_manager'],                                  action: 'invoice' },
]

function QuickActionBar({ role, onBook }: { role: Role; onBook: () => void }) {
  const navigate = useNavigate()
  const visible = QUICK_ACTIONS.filter(a => a.roles.includes(role))
  if (visible.length === 0) return null

  const handleAction = (action: QuickAction['action']) => {
    if (action === 'book') { onBook(); return }
    if (action === 'checkin')    navigate('/check-in')
    if (action === 'addpatient') navigate('/patients')
    if (action === 'lab')        navigate('/lab/publish')
    if (action === 'invoice')    navigate('/billing')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(qa => (
        <Button
          key={qa.action}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => handleAction(qa.action)}
        >
          <qa.icon className="h-3.5 w-3.5" />
          {qa.label}
        </Button>
      ))}
    </div>
  )
}

// ── CC-116: Walk-In Slot Finder ───────────────────────────────────────────────

function WalkInSlotFinder({
  todayWd,
  onBook,
}: {
  todayWd: number
  onBook: (profId: string, slot: string) => void
}) {
  const availableToday = PROFESSIONALS.filter(p =>
    PROF_SCHEDULES.some(s => s.professionalId === p.id && s.weekday === todayWd)
  )
  const [selectedProfId, setSelectedProfId] = useState(availableToday[0]?.id ?? '')

  const nextSlot = useMemo(() => {
    if (!selectedProfId) return null
    const prof = PROFESSIONALS.find(p => p.id === selectedProfId)
    const sched = PROF_SCHEDULES.find(s => s.professionalId === selectedProfId && s.weekday === todayWd)
    if (!prof || !sched) return null
    const allSlots = generateSlots(sched.startTime, sched.endTime, prof.slotMins)
    const bookedSlots = new Set(
      TODAY_APPTS
        .filter(a => a.professionalId === selectedProfId && a.status !== 'no-show' && a.status !== 'completed')
        .map(a => a.startTime)
    )
    return allSlots.find(s => !bookedSlots.has(s)) ?? null
  }, [selectedProfId, todayWd])

  if (availableToday.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          Walk-In Slot Finder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <Label className="text-xs">Professional</Label>
            <select
              aria-label="Professional"
              className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
              value={selectedProfId}
              onChange={e => setSelectedProfId(e.target.value)}
            >
              {availableToday.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            {nextSlot ? (
              <>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Next open slot</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">{nextSlot}</p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onBook(selectedProfId, nextSlot)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Book Now
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No open slots today</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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
  prefillSlot,
}: {
  open: boolean
  onClose: () => void
  prefillProfId?: string
  prefillSlot?: string
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
    const initialSlot = (prefillSlot && slots.includes(prefillSlot)) ? prefillSlot : (slots[0] ?? '')
    setForm({
      patientId: '',
      patientName: '',
      professionalId: profId,
      date: today,
      startTime: initialSlot,
      durationMins: prof?.slotMins ?? 30,
      type: APPOINTMENT_TYPES[0],
    })
    setPatientSearch('')
    setSuccess(false)
  }, [open, prefillProfId, prefillSlot])

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
  const navigate = useNavigate()
  const role: Role = user?.role ?? 'receptionist'
  const canBook = ['receptionist', 'branch_manager', 'org_admin'].includes(role) || !user
  const canCheckIn = ['receptionist', 'branch_manager', 'org_admin', 'nurse'].includes(role) || !user

  const [bookOpen,       setBookOpen]       = useState(false)
  const [prefillProfId,  setPrefillProfId]  = useState<string | undefined>(undefined)
  const [prefillSlot,    setPrefillSlot]    = useState<string | undefined>(undefined)
  const [localStatuses,  setLocalStatuses]  = useState<Record<string, AppointmentStatus>>({})
  const [localArrivedAt, setLocalArrivedAt] = useState<Record<string, string>>({})

  const todayWd = toWeekday(new Date())

  const effectiveAppts = TODAY_APPTS.map(a => ({
    ...a,
    status: (localStatuses[a.id] ?? a.status) as AppointmentStatus,
    arrivedAt: localArrivedAt[a.id] ?? a.arrivedAt,
  }))

  const profAvailability = PROFESSIONALS.map(p => {
    const sched = PROF_SCHEDULES.find(s => s.professionalId === p.id && s.weekday === todayWd)
    const totalSlots = sched ? generateSlots(sched.startTime, sched.endTime, p.slotMins).length : 0
    const bookedSlots = TODAY_APPTS.filter(
      a => a.professionalId === p.id && a.status !== 'no-show'
    ).length
    return {
      ...p,
      available: !!sched,
      todayApptCount: TODAY_APPTS.filter(a => a.professionalId === p.id).length,
      totalSlots,
      bookedSlots,
    }
  })

  const openBook = (profId?: string, slot?: string) => {
    setPrefillProfId(profId)
    setPrefillSlot(slot)
    setBookOpen(true)
  }

  const handleCheckIn = (apptId: string) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setLocalStatuses(prev => ({ ...prev, [apptId]: 'checked-in' }))
    setLocalArrivedAt(prev => ({ ...prev, [apptId]: time }))
  }

  const labPending     = PENDING_ACTIONS.find(a => a.label === 'lab results to publish')
  const invoicePending = PENDING_ACTIONS.find(a => a.label === 'invoices unpaid')
  const showLabCard     = !!(labPending     && labPending.roles.includes(role)     && labPending.count > 0)
  const showInvoiceCard = !!(invoicePending && invoicePending.roles.includes(role) && invoicePending.count > 0)

  return (
    <div className="space-y-5">
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

      {/* CC-115: Quick-action bar */}
      <QuickActionBar role={role} onBook={() => openBook()} />

      {/* CC-116: Walk-in slot finder */}
      <WalkInSlotFinder todayWd={todayWd} onBook={openBook} />

      {/* Row 1: Today's Appointments + Check-In Queue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Appointments — CC-117 status bar */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Today's Appointments</CardTitle>
          </CardHeader>
          <AppointmentStatusBar appts={effectiveAppts} />
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {effectiveAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/appointments/${appt.id}/visit`)}
                  role="button"
                  aria-label={`View appointment for ${appt.patientName}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-medium">{appt.patientName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {PROFESSIONALS.find(p => p.id === appt.professionalId)?.name}
                        {appt.startTime && <span className="ml-1 tabular-nums">· {appt.startTime}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canCheckIn && (appt.status === 'booked' || appt.status === 'confirmed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={e => { e.stopPropagation(); handleCheckIn(appt.id) }}
                      >
                        <UserCheck className="h-3 w-3" />
                        Check In
                      </Button>
                    )}
                    <Badge variant={STATUS_BADGE_VARIANT[appt.status]} className="capitalize text-xs">
                      {appt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Check-In Queue — CC-112 */}
        <CheckInQueue appts={effectiveAppts} />
      </div>

      {/* Row 2: Professionals Today + Pending Lab Results + Pending Invoices */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {/* Professionals Today — CC-114 utilization bars */}
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
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-xs font-medium">{p.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.specialization} · {p.slotMins} min slots</p>
                        {/* CC-114 utilization bar */}
                        {p.available && (
                          <SlotUtilizationBar totalSlots={p.totalSlots} bookedSlots={p.bookedSlots} />
                        )}
                      </div>
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

        {/* Pending Lab Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              Pending Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showLabCard ? (
              <div>
                <p className="text-3xl font-bold tabular-nums">{labPending!.count}</p>
                <p className="text-sm text-muted-foreground mt-1">results to publish</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full gap-1.5"
                  onClick={() => navigate(labPending!.href)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  View All
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending lab results.</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showInvoiceCard ? (
              <div>
                <p className="text-3xl font-bold tabular-nums">{invoicePending!.count}</p>
                <p className="text-sm text-muted-foreground mt-1">invoices unpaid</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full gap-1.5"
                  onClick={() => navigate(invoicePending!.href)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  View All
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending invoices.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <BookAppointmentSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        prefillProfId={prefillProfId}
        prefillSlot={prefillSlot}
      />
    </div>
  )
}

export default DashboardPage
