import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { PatientForm, MOCK_PATIENTS } from '@/components/patients/PatientForm'
import type { Patient } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'Agenda' | 'Day' | 'Week' | 'Month'
type ApptStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

interface Professional {
  id: string
  name: string
  role: string
  colorIdx: number
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  professionalId: string
  date: string       // 'YYYY-MM-DD'
  startTime: string  // 'HH:mm'
  durationMins: number
  type: string
  status: ApptStatus
}

// ── Color Palette (one per professional) ──────────────────────────────────────

const COLORS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // blue
  { bg: '#dcfce7', border: '#22c55e', text: '#166534' }, // green
  { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' }, // purple
  { bg: '#ffedd5', border: '#f97316', text: '#9a3412' }, // orange
  { bg: '#fce7f3', border: '#ec4899', text: '#831843' }, // pink
  { bg: '#e0f2fe', border: '#0ea5e9', text: '#075985' }, // sky
  { bg: '#fef9c3', border: '#eab308', text: '#713f12' }, // amber
  { bg: '#ccfbf1', border: '#14b8a6', text: '#134e4a' }, // teal
]

// ── Professionals ─────────────────────────────────────────────────────────────

const PROFESSIONALS: Professional[] = [
  { id: 'p1', name: 'Dr. Sarah Kim',    role: 'Doctor', colorIdx: 0 },
  { id: 'p2', name: 'Dr. James Park',   role: 'Doctor', colorIdx: 1 },
  { id: 'p3', name: 'Dr. Liu Wei',      role: 'Doctor', colorIdx: 2 },
  { id: 'p4', name: 'Nurse Ana Santos', role: 'Nurse',  colorIdx: 3 },
  { id: 'p5', name: 'Dr. Priya Nair',   role: 'Doctor', colorIdx: 4 },
]

// ── Mock Appointments ─────────────────────────────────────────────────────────

const MOCK_APPOINTMENTS: Appointment[] = [
  // Mon 2026-03-16
  { id: 'a01', patientId: 'pt1', patientName: 'John Doe',       professionalId: 'p1', date: '2026-03-16', startTime: '08:30', durationMins: 30, type: 'Consultation', status: 'completed' },
  { id: 'a02', patientId: 'pt2', patientName: 'Maria Chen',     professionalId: 'p2', date: '2026-03-16', startTime: '09:00', durationMins: 30, type: 'Follow-up',    status: 'completed' },
  { id: 'a03', patientId: 'pt3', patientName: 'Carlos Rivera',  professionalId: 'p3', date: '2026-03-16', startTime: '10:00', durationMins: 60, type: 'New Patient',  status: 'completed' },
  { id: 'a04', patientId: 'pt4', patientName: 'Priya Sharma',   professionalId: 'p4', date: '2026-03-16', startTime: '11:30', durationMins: 30, type: 'Lab Review',   status: 'completed' },
  { id: 'a05', patientId: 'pt5', patientName: 'Tom Wilson',     professionalId: 'p1', date: '2026-03-16', startTime: '14:00', durationMins: 30, type: 'Consultation', status: 'completed' },
  { id: 'a06', patientId: 'pt6', patientName: 'Sara Ahmed',     professionalId: 'p5', date: '2026-03-16', startTime: '15:30', durationMins: 30, type: 'Follow-up',    status: 'completed' },
  // Tue 2026-03-17
  { id: 'a07', patientId: 'pt7', patientName: 'James Liu',      professionalId: 'p2', date: '2026-03-17', startTime: '09:00', durationMins: 30, type: 'Consultation', status: 'completed' },
  { id: 'a08', patientId: 'pt8', patientName: 'Anna Kowalski',  professionalId: 'p1', date: '2026-03-17', startTime: '10:30', durationMins: 30, type: 'Follow-up',    status: 'completed' },
  { id: 'a09', patientId: 'pt3', patientName: 'Carlos Rivera',  professionalId: 'p3', date: '2026-03-17', startTime: '14:00', durationMins: 60, type: 'Consultation', status: 'completed' },
  // Wed 2026-03-18 (today)
  { id: 'a10', patientId: 'pt1', patientName: 'John Doe',       professionalId: 'p1', date: '2026-03-18', startTime: '08:30', durationMins: 30, type: 'Follow-up',    status: 'booked' },
  { id: 'a11', patientId: 'pt2', patientName: 'Jane Smith',     professionalId: 'p2', date: '2026-03-18', startTime: '09:30', durationMins: 30, type: 'Consultation', status: 'booked' },
  { id: 'a12', patientId: 'pt3', patientName: 'Carlos Rivera',  professionalId: 'p3', date: '2026-03-18', startTime: '11:00', durationMins: 30, type: 'Lab Review',   status: 'booked' },
  { id: 'a13', patientId: 'pt4', patientName: 'Priya Sharma',   professionalId: 'p4', date: '2026-03-18', startTime: '13:30', durationMins: 30, type: 'Consultation', status: 'booked' },
  { id: 'a14', patientId: 'pt9', patientName: 'Aisha Patel',    professionalId: 'p5', date: '2026-03-18', startTime: '14:30', durationMins: 60, type: 'New Patient',  status: 'booked' },
  { id: 'a15', patientId: 'pt5', patientName: 'Tom Wilson',     professionalId: 'p1', date: '2026-03-18', startTime: '16:00', durationMins: 30, type: 'Emergency',    status: 'booked' },
  // Thu 2026-03-19
  { id: 'a16', patientId: 'pt6', patientName: 'Sara Ahmed',     professionalId: 'p2', date: '2026-03-19', startTime: '09:00', durationMins: 30, type: 'Follow-up',    status: 'booked' },
  { id: 'a17', patientId: 'pt7', patientName: 'James Liu',      professionalId: 'p5', date: '2026-03-19', startTime: '10:00', durationMins: 60, type: 'Consultation', status: 'booked' },
  // Fri 2026-03-20
  { id: 'a18', patientId: 'pt1', patientName: 'John Doe',       professionalId: 'p1', date: '2026-03-20', startTime: '08:30', durationMins: 30, type: 'Consultation', status: 'booked' },
  { id: 'a19', patientId: 'pt8', patientName: 'Anna Kowalski',  professionalId: 'p3', date: '2026-03-20', startTime: '10:00', durationMins: 30, type: 'Lab Review',   status: 'booked' },
  { id: 'a20', patientId: 'pt7', patientName: 'James Liu',      professionalId: 'p4', date: '2026-03-20', startTime: '11:30', durationMins: 30, type: 'Follow-up',    status: 'booked' },
  { id: 'a21', patientId: 'pt2', patientName: 'Maria Chen',     professionalId: 'p2', date: '2026-03-20', startTime: '15:00', durationMins: 30, type: 'Consultation', status: 'booked' },
  // Next week
  { id: 'a22', patientId: 'pt9', patientName: 'Aisha Patel',    professionalId: 'p1', date: '2026-03-23', startTime: '09:00', durationMins: 30, type: 'Follow-up',    status: 'booked' },
  { id: 'a23', patientId: 'pt4', patientName: 'Priya Sharma',   professionalId: 'p3', date: '2026-03-24', startTime: '10:30', durationMins: 60, type: 'Consultation', status: 'booked' },
  { id: 'a24', patientId: 'pt6', patientName: 'Sara Ahmed',     professionalId: 'p5', date: '2026-03-25', startTime: '14:00', durationMins: 30, type: 'Lab Review',   status: 'booked' },
  { id: 'a25', patientId: 'pt3', patientName: 'Carlos Rivera',  professionalId: 'p2', date: '2026-03-26', startTime: '08:30', durationMins: 30, type: 'Follow-up',    status: 'booked' },
]

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Lab Review', 'New Patient', 'Emergency']

// ── Date Utilities ─────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return fmt(a) === fmt(b)
}

// Mon = 0 … Sun = 6
function weekDayIdx(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 6 : day - 1
}

function getWeekDays(d: Date): Date[] {
  const start = addDays(d, -weekDayIdx(d))
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

function getMonthGrid(d: Date): (Date | null)[][] {
  const year = d.getFullYear()
  const month = d.getMonth()
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  let offset = weekDayIdx(first)
  const cells: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(year, month, i))
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minsToTime(n: number): string {
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_LONG    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

// Hours 07–18 shown in the time grid
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7)
// 30-min slots for Day view
const HALF_SLOTS = HOURS.flatMap(h => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`])

function statusVariant(s: ApptStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'booked' || s === 'confirmed') return 'default'
  if (s === 'completed') return 'secondary'
  if (s === 'cancelled') return 'destructive'
  return 'outline'
}

// ── Appointment Chip (shared across all views) ─────────────────────────────────

function ApptChip({ appt, showTime = false, showProf = false, onClick }: {
  appt: Appointment
  showTime?: boolean
  showProf?: boolean
  onClick?: () => void
}) {
  const prof = PROFESSIONALS.find(p => p.id === appt.professionalId)
  const c    = COLORS[prof?.colorIdx ?? 0]
  const end  = minsToTime(timeToMins(appt.startTime) + appt.durationMins)
  return (
    <div
      style={{ backgroundColor: c.bg, borderLeftColor: c.border }}
      className="border-l-[3px] rounded px-2 py-1 text-xs overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <p className="font-semibold truncate leading-tight" style={{ color: c.text }}>{appt.patientName}</p>
      {showTime && <p className="truncate leading-tight" style={{ color: c.text, opacity: 0.8 }}>{appt.startTime}–{end}</p>}
      <p className="truncate leading-tight" style={{ color: c.text, opacity: 0.8 }}>{appt.type}</p>
      {showProf && prof && <p className="truncate leading-tight" style={{ color: c.text, opacity: 0.65 }}>{prof.name}</p>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Agenda View ────────────────────────────────────────────────────────────────

function AgendaView({ appointments, currentDate, onSelect }: { appointments: Appointment[]; currentDate: Date; onSelect: (a: Appointment) => void }) {
  const today = new Date()
  const days  = Array.from({ length: 30 }, (_, i) => addDays(currentDate, i))
  const groups = days
    .map(d => ({
      date:  d,
      appts: appointments.filter(a => a.date === fmt(d)).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter(g => g.appts.length > 0)

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No appointments in the next 30 days.</p>
  }

  return (
    <div className="space-y-6">
      {groups.map(({ date, appts }) => {
        const isToday  = isSameDay(date, today)
        const label    = `${isToday ? 'Today — ' : ''}${DAY_LONG[weekDayIdx(date)]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
        return (
          <div key={fmt(date)}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </p>
            <div className="space-y-1.5">
              {appts.map(a => {
                const prof = PROFESSIONALS.find(p => p.id === a.professionalId)
                const c    = COLORS[prof?.colorIdx ?? 0]
                const end  = minsToTime(timeToMins(a.startTime) + a.durationMins)
                return (
                  <div
                    key={a.id}
                    style={{ borderLeftColor: c.border, backgroundColor: c.bg }}
                    className="border-l-[3px] rounded-r px-4 py-2 flex items-center justify-between gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onSelect(a)}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{a.startTime}–{end}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: c.text }}>{a.patientName}</p>
                        <p className="text-xs" style={{ color: c.text, opacity: 0.75 }}>{a.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: c.border + '22', color: c.text }}
                      >
                        {prof?.name}
                      </span>
                      <Badge variant={statusVariant(a.status)} className="text-xs capitalize">{a.status}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Day View ───────────────────────────────────────────────────────────────────

function DayView({ appointments, currentDate, canBook, onBook, onSelect }: {
  appointments: Appointment[]
  currentDate: Date
  canBook: boolean
  onBook: (slot: string) => void
  onSelect: (a: Appointment) => void
}) {
  const dateStr = fmt(currentDate)
  const bySlot  = appointments
    .filter(a => a.date === dateStr)
    .reduce<Record<string, Appointment>>((acc, a) => { acc[a.startTime] = a; return acc }, {})

  return (
    <div className="divide-y">
      {HALF_SLOTS.map(slot => {
        const appt   = bySlot[slot]
        const isHour = slot.endsWith(':00')
        return (
          <div key={slot} className={`flex items-start gap-3 ${isHour ? 'pt-3 pb-1' : 'py-1'}`}>
            <span className={`text-xs font-mono w-12 shrink-0 mt-0.5 ${isHour ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {slot}
            </span>
            <div className="flex-1 min-w-0">
              {appt ? (
                <ApptChip appt={appt} showProf onClick={() => onSelect(appt)} />
              ) : (
                <div className="flex items-center gap-2 h-6">
                  <div className="flex-1 border-t border-dashed border-border/40" />
                  {canBook && (
                    <button
                      onClick={() => onBook(slot)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors px-1"
                    >
                      Book
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Week View ──────────────────────────────────────────────────────────────────

function WeekView({ appointments, currentDate, onSelect }: { appointments: Appointment[]; currentDate: Date; onSelect: (a: Appointment) => void }) {
  const weekDays = getWeekDays(currentDate)
  const today    = new Date()

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 640 }}>
        {/* Day headers */}
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b pb-2 mb-1">
          <div />
          {weekDays.map(d => {
            const isToday = isSameDay(d, today)
            return (
              <div key={fmt(d)} className="text-center">
                <p className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {DAY_SHORT[weekDayIdx(d)]}
                </p>
                <p className={`text-sm font-semibold leading-tight ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {d.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Hour rows */}
        {HOURS.map(h => {
          const hStr = `${String(h).padStart(2, '0')}:00`
          return (
            <div key={h} className="grid grid-cols-[3rem_repeat(7,1fr)] min-h-[4rem] border-b border-border/30">
              <span className="text-xs text-muted-foreground font-mono pt-1">{hStr}</span>
              {weekDays.map(d => {
                const appts = appointments
                  .filter(a =>
                    a.date === fmt(d) &&
                    timeToMins(a.startTime) >= h * 60 &&
                    timeToMins(a.startTime) < (h + 1) * 60,
                  )
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                return (
                  <div key={fmt(d)} className="p-0.5 space-y-0.5 border-l border-border/20">
                    {appts.map(a => <ApptChip key={a.id} appt={a} showTime onClick={() => onSelect(a)} />)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Month View ─────────────────────────────────────────────────────────────────

function MonthView({ appointments, currentDate, onDayClick }: {
  appointments: Appointment[]
  currentDate: Date
  onDayClick: (d: Date) => void
}) {
  const grid  = getMonthGrid(currentDate)
  const today = new Date()

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b mb-1">
        {DAY_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground pb-2">{d}</div>
        ))}
      </div>

      {/* Calendar rows */}
      {grid.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7 border-t border-border/30">
          {row.map((d, ci) => {
            if (!d) {
              return <div key={ci} className="min-h-[5.5rem] border-l border-border/20 bg-muted/10" />
            }
            const dayStr  = fmt(d)
            const dayAppts = appointments
              .filter(a => a.date === dayStr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
            const isToday        = isSameDay(d, today)
            const isCurrentMonth = d.getMonth() === currentDate.getMonth()
            return (
              <div
                key={ci}
                className="min-h-[5.5rem] p-1 border-l border-border/20 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onDayClick(d)}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday
                    ? 'bg-primary text-primary-foreground'
                    : isCurrentMonth
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}>
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map(a => {
                    const prof = PROFESSIONALS.find(p => p.id === a.professionalId)
                    const c    = COLORS[prof?.colorIdx ?? 0]
                    return (
                      <div
                        key={a.id}
                        style={{ backgroundColor: c.border, color: '#fff' }}
                        className="text-[10px] px-1.5 rounded truncate leading-5"
                      >
                        {a.startTime} {a.patientName.split(' ')[0]}
                      </div>
                    )
                  })}
                  {dayAppts.length > 3 && (
                    <p className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

const TODAY = new Date(2026, 2, 18) // 2026-03-18 (stub — replace with new Date() at API integration)

type NewApptForm = {
  patientId: string
  patientName: string
  professionalId: string
  date: string
  startTime: string
  durationMins: number
  type: string
}

type ApptEditForm = NewApptForm & { status: ApptStatus }

export function AppointmentsPage() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const canBook    = user?.role === 'receptionist' || user?.role === 'branch_manager' || !user
  const isProfessional = user?.role === 'doctor' || user?.role === 'nurse'

  const [view,          setView]          = useState<ViewMode>('Day')
  const [currentDate,   setCurrentDate]   = useState<Date>(TODAY)
  const [selectedProfs, setSelectedProfs] = useState<string[]>([])
  const [appointments,  setAppointments]  = useState<Appointment[]>(MOCK_APPOINTMENTS)
  const [patients,      setPatients]      = useState<Patient[]>(MOCK_PATIENTS)

  // New appointment modal
  const [showNewModal,     setShowNewModal]     = useState(false)
  const [patientSearch,    setPatientSearch]    = useState('')
  const [patientDropOpen,  setPatientDropOpen]  = useState(false)
  const [showPatientForm,  setShowPatientForm]  = useState(false)
  const [newForm,          setNewForm]          = useState<NewApptForm>({
    patientId:      '',
    patientName:    '',
    professionalId: PROFESSIONALS[0].id,
    date:           fmt(TODAY),
    startTime:      '08:00',
    durationMins:   30,
    type:           APPOINTMENT_TYPES[0],
  })

  const patientSuggestions = useMemo(() => {
    const q = patientSearch.toLowerCase().trim()
    if (!q) return patients.slice(0, 6)
    return patients.filter(p =>
      p.fullName.toLowerCase().includes(q) || (p.phone ?? '').includes(q)
    ).slice(0, 6)
  }, [patients, patientSearch])

  const selectPatient = (p: Patient) => {
    setNewForm(f => ({ ...f, patientId: p.id, patientName: p.fullName }))
    setPatientSearch(p.fullName)
    setPatientDropOpen(false)
  }

  const handleNewPatientSaved = (p: Patient) => {
    setPatients(prev => [...prev, p])
    selectPatient(p)
    setShowPatientForm(false)
  }

  // View / edit / delete modal
  const [viewApptId,        setViewApptId]        = useState<string | null>(null)
  const [apptModalMode,     setApptModalMode]     = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const [apptEditForm,      setApptEditForm]      = useState<ApptEditForm | null>(null)

  const viewAppt = viewApptId ? appointments.find(a => a.id === viewApptId) ?? null : null

  const openAppt = (a: Appointment) => {
    setViewApptId(a.id)
    setApptModalMode('view')
    setApptEditForm(null)
  }

  const closeApptModal = () => {
    setViewApptId(null)
    setApptModalMode('view')
    setApptEditForm(null)
  }

  const startApptEdit = (a: Appointment) => {
    setApptEditForm({
      patientName:    a.patientName,
      professionalId: a.professionalId,
      date:           a.date,
      startTime:      a.startTime,
      durationMins:   a.durationMins,
      type:           a.type,
      status:         a.status,
    })
    setApptModalMode('edit')
  }

  const saveApptEdit = () => {
    if (!viewApptId || !apptEditForm) return
    setAppointments(prev => prev.map(a =>
      a.id === viewApptId
        ? { ...a, ...apptEditForm }
        : a
    ))
    closeApptModal()
  }

  const confirmDeleteAppt = () => {
    if (!viewApptId) return
    setAppointments(prev => prev.filter(a => a.id !== viewApptId))
    closeApptModal()
  }

  // Filtered appointments
  const filtered = useMemo(() => {
    if (selectedProfs.length === 0) return appointments
    return appointments.filter(a => selectedProfs.includes(a.professionalId))
  }, [appointments, selectedProfs])

  const toggleProf = (id: string) => {
    setSelectedProfs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const moveDate = (dir: 1 | -1) => {
    setCurrentDate(prev => {
      if (view === 'Agenda' || view === 'Day') return addDays(prev, dir)
      if (view === 'Week')  return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const periodLabel = useMemo(() => {
    if (view === 'Agenda' || view === 'Day') {
      const isToday = isSameDay(currentDate, TODAY)
      return `${isToday ? 'Today — ' : ''}${DAY_LONG[weekDayIdx(currentDate)]}, ${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    if (view === 'Week') {
      const days  = getWeekDays(currentDate)
      const start = days[0]
      const end   = days[6]
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`
      }
      return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`
    }
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }, [view, currentDate])

  const openNewModal = (date?: string, time?: string, prefillProfId?: string) => {
    setNewForm({
      patientId:      '',
      patientName:    '',
      professionalId: prefillProfId ?? PROFESSIONALS[0].id,
      date:           date ?? fmt(currentDate),
      startTime:      time ?? '08:00',
      durationMins:   30,
      type:           APPOINTMENT_TYPES[0],
    })
    setPatientSearch('')
    setPatientDropOpen(false)
    setShowNewModal(true)
  }

  const handleCreateAppt = () => {
    if (!newForm.patientName.trim()) return
    setAppointments(prev => [...prev, {
      id:             `a-${Date.now()}`,
      patientId:      newForm.patientId || `pt-${Date.now()}`,
      patientName:    newForm.patientName,
      professionalId: newForm.professionalId,
      date:           newForm.date,
      startTime:      newForm.startTime,
      durationMins:   newForm.durationMins,
      type:           newForm.type,
      status:         'booked',
    }])
    setShowNewModal(false)
  }

  const todayCount = filtered.filter(a => a.date === fmt(TODAY)).length

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <span className="text-xs text-muted-foreground">{todayCount} today · {filtered.length} total</span>
        </div>
        <div className="flex items-center gap-2">
          {canBook && (
            <Button size="sm" onClick={() => openNewModal()}>+ New Appointment</Button>
          )}
          <div className="flex gap-1 border rounded-md p-1 bg-muted/40">
            {(['Agenda', 'Day', 'Week', 'Month'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Professional filter ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">Filter by professional:</span>
        <button
          onClick={() => setSelectedProfs([])}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            selectedProfs.length === 0
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:border-foreground'
          }`}
        >
          All
        </button>
        {PROFESSIONALS.map(p => {
          const c      = COLORS[p.colorIdx]
          const active = selectedProfs.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggleProf(p.id)}
              style={
                active
                  ? { backgroundColor: c.border, color: '#fff', borderColor: c.border }
                  : { borderColor: c.border, color: c.text, backgroundColor: 'transparent' }
              }
              className="text-xs px-3 py-1 rounded-full border transition-colors hover:opacity-80"
            >
              {p.name}
            </button>
          )
        })}
      </div>

      {/* ── Navigation bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => moveDate(-1)}>‹</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentDate(TODAY)}>Today</Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => moveDate(1)}>›</Button>
        </div>
        <p className="text-sm font-medium">{periodLabel}</p>
      </div>

      {/* ── Calendar ────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          {view === 'Agenda' && (
            <AgendaView appointments={filtered} currentDate={currentDate} onSelect={openAppt} />
          )}
          {view === 'Day' && (
            <DayView
              appointments={filtered}
              currentDate={currentDate}
              canBook={canBook}
              onBook={slot => openNewModal(fmt(currentDate), slot)}
              onSelect={openAppt}
            />
          )}
          {view === 'Week' && (
            <WeekView appointments={filtered} currentDate={currentDate} onSelect={openAppt} />
          )}
          {view === 'Month' && (
            <MonthView
              appointments={filtered}
              currentDate={currentDate}
              onDayClick={d => { setCurrentDate(d); setView('Day') }}
            />
          )}
        </CardContent>
      </Card>

      {/* ── New Appointment modal ────────────────────────────────────────────── */}
      {showNewModal && (
        <Modal title="New Appointment" onClose={() => setShowNewModal(false)}>
          <div className="space-y-3">
            {/* Patient combobox */}
            <div className="space-y-1 relative">
              <label htmlFor="new-patient-search" className="text-xs font-medium">Patient</label>
              <input
                id="new-patient-search"
                className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                placeholder="Search by name or phone…"
                value={patientSearch}
                autoFocus
                onChange={e => {
                  setPatientSearch(e.target.value)
                  setNewForm(f => ({ ...f, patientId: '', patientName: e.target.value }))
                  setPatientDropOpen(true)
                }}
                onFocus={() => setPatientDropOpen(true)}
              />
              {patientDropOpen && (
                <div className="absolute z-50 w-full bg-background border rounded-md shadow-lg mt-0.5 max-h-48 overflow-y-auto">
                  {patientSuggestions.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between"
                      onMouseDown={e => { e.preventDefault(); selectPatient(p) }}
                    >
                      <span>{p.fullName}</span>
                      <span className="text-xs text-muted-foreground">{p.phone}</span>
                    </button>
                  ))}
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-muted/50 border-t"
                    onMouseDown={e => { e.preventDefault(); setPatientDropOpen(false); setShowPatientForm(true) }}
                  >
                    + Create new patient{patientSearch ? `: "${patientSearch}"` : ''}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Professional</label>
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={newForm.professionalId}
                  onChange={e => setNewForm(f => ({ ...f, professionalId: e.target.value }))}
                  aria-label="Professional"
                >
                  {PROFESSIONALS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Type</label>
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={newForm.type}
                  onChange={e => setNewForm(f => ({ ...f, type: e.target.value }))}
                  aria-label="Type"
                >
                  {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                  value={newForm.date}
                  onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Start Time</label>
                <input
                  type="time"
                  className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                  value={newForm.startTime}
                  onChange={e => setNewForm(f => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Duration (mins)</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                  value={newForm.durationMins}
                  onChange={e => setNewForm(f => ({ ...f, durationMins: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" onClick={handleCreateAppt}>Book Appointment</Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
          </div>
        </Modal>
      )}

      {/* ── Inline PatientForm for new patient creation ──────────────────────── */}
      <PatientForm
        open={showPatientForm}
        onClose={() => setShowPatientForm(false)}
        onSave={handleNewPatientSaved}
        initialValues={patientSearch ? { firstName: patientSearch.split(' ')[0], lastName: patientSearch.split(' ').slice(1).join(' ') } : undefined}
      />

      {/* ── Appointment detail / edit / delete modal ─────────────────────────── */}
      {viewAppt && (
        <Modal
          title={apptModalMode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
          onClose={closeApptModal}
        >
          {apptModalMode === 'view' && (
            <>
              <dl className="space-y-3 text-sm">
                {[
                  ['Patient',   viewAppt.patientName],
                  ['Date',      viewAppt.date],
                  ['Time',      `${viewAppt.startTime} – ${minsToTime(timeToMins(viewAppt.startTime) + viewAppt.durationMins)}`],
                  ['Duration',  `${viewAppt.durationMins} mins`],
                  ['Type',      viewAppt.type],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground shrink-0">{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">Professional</dt>
                  <dd className="font-medium text-right">{PROFESSIONALS.find(p => p.id === viewAppt.professionalId)?.name ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">Status</dt>
                  <dd><Badge variant={statusVariant(viewAppt.status)} className="text-xs capitalize">{viewAppt.status}</Badge></dd>
                </div>
              </dl>
              <div className="flex gap-2 mt-5 flex-wrap">
                {isProfessional && (
                  <Button
                    size="sm"
                    onClick={() => { closeApptModal(); navigate(`/appointments/${viewAppt.id}/visit`) }}
                  >
                    Start Visit
                  </Button>
                )}
                {canBook && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => startApptEdit(viewAppt)}>Edit</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setApptModalMode('confirm-delete')}
                    >
                      Delete
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={closeApptModal}>Close</Button>
              </div>
            </>
          )}

          {apptModalMode === 'confirm-delete' && (
            <>
              <p className="text-sm text-muted-foreground">
                Delete the appointment for <span className="font-medium text-foreground">{viewAppt.patientName}</span> on {viewAppt.date} at {viewAppt.startTime}? This cannot be undone.
              </p>
              <div className="flex gap-2 mt-5">
                <Button size="sm" variant="destructive" onClick={confirmDeleteAppt}>Delete</Button>
                <Button size="sm" variant="outline" onClick={() => setApptModalMode('view')}>Cancel</Button>
              </div>
            </>
          )}

          {apptModalMode === 'edit' && apptEditForm && (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Patient Name</label>
                  <input
                    className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                    value={apptEditForm.patientName}
                    onChange={e => setApptEditForm(f => f ? { ...f, patientName: e.target.value } : f)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Professional</label>
                    <select
                      className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                      value={apptEditForm.professionalId}
                      onChange={e => setApptEditForm(f => f ? { ...f, professionalId: e.target.value } : f)}
                      aria-label="Professional"
                    >
                      {PROFESSIONALS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Type</label>
                    <select
                      className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                      value={apptEditForm.type}
                      onChange={e => setApptEditForm(f => f ? { ...f, type: e.target.value } : f)}
                      aria-label="Type"
                    >
                      {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date</label>
                    <input
                      type="date"
                      className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                      value={apptEditForm.date}
                      onChange={e => setApptEditForm(f => f ? { ...f, date: e.target.value } : f)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Start Time</label>
                    <input
                      type="time"
                      className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                      value={apptEditForm.startTime}
                      onChange={e => setApptEditForm(f => f ? { ...f, startTime: e.target.value } : f)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Duration (mins)</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                      value={apptEditForm.durationMins}
                      onChange={e => setApptEditForm(f => f ? { ...f, durationMins: Number(e.target.value) } : f)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Status</label>
                    <select
                      className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                      value={apptEditForm.status}
                      onChange={e => setApptEditForm(f => f ? { ...f, status: e.target.value as ApptStatus } : f)}
                      aria-label="Status"
                    >
                      {(['booked', 'confirmed', 'completed', 'cancelled', 'no_show'] as ApptStatus[]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" onClick={saveApptEdit}>Save Changes</Button>
                <Button size="sm" variant="outline" onClick={() => setApptModalMode('view')}>Cancel</Button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
