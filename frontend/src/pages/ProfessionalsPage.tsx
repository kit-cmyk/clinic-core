import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import type { Professional, ProfessionalSchedule, TimeOff } from '@/types'

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_PROFESSIONALS: Professional[] = [
  { id: 'pr1', tenantId: 't1', userId: 'u1', name: 'Dr. Sarah Kim',    specialization: 'General Medicine',  bio: 'Board-certified GP with 12 years of experience.',       slotDurationMins: 30, isActive: true,  branch: 'Main Branch' },
  { id: 'pr2', tenantId: 't1', userId: 'u2', name: 'Dr. James Park',   specialization: 'Cardiology',         bio: 'Specialist in cardiovascular disease and prevention.',   slotDurationMins: 45, isActive: true,  branch: 'Main Branch' },
  { id: 'pr3', tenantId: 't1', userId: 'u3', name: 'Dr. Liu Wei',      specialization: 'Pediatrics',         bio: 'Dedicated to child health and development.',             slotDurationMins: 30, isActive: true,  branch: 'Downtown Clinic' },
  { id: 'pr4', tenantId: 't1', userId: 'u4', name: 'Nurse Ana Santos', specialization: 'General Nursing',    bio: 'Senior registered nurse specializing in patient care.',  slotDurationMins: 20, isActive: true,  branch: 'Downtown Clinic' },
  { id: 'pr5', tenantId: 't1', userId: 'u5', name: 'Dr. Priya Nair',   specialization: 'Dermatology',        bio: 'Dermatologist with focus on medical and cosmetic care.', slotDurationMins: 30, isActive: false, branch: 'Westside Location' },
]

const MOCK_SCHEDULES: ProfessionalSchedule[] = [
  { id: 's1', tenantId: 't1', professionalId: 'pr1', branchId: 'b1', weekday: 0, startTime: '08:00', endTime: '17:00' },
  { id: 's2', tenantId: 't1', professionalId: 'pr1', branchId: 'b1', weekday: 1, startTime: '08:00', endTime: '17:00' },
  { id: 's3', tenantId: 't1', professionalId: 'pr1', branchId: 'b1', weekday: 2, startTime: '08:00', endTime: '17:00' },
  { id: 's4', tenantId: 't1', professionalId: 'pr1', branchId: 'b1', weekday: 3, startTime: '08:00', endTime: '17:00' },
  { id: 's5', tenantId: 't1', professionalId: 'pr1', branchId: 'b1', weekday: 4, startTime: '08:00', endTime: '13:00' },
  { id: 's6', tenantId: 't1', professionalId: 'pr2', branchId: 'b1', weekday: 0, startTime: '09:00', endTime: '17:00' },
  { id: 's7', tenantId: 't1', professionalId: 'pr2', branchId: 'b1', weekday: 2, startTime: '09:00', endTime: '17:00' },
  { id: 's8', tenantId: 't1', professionalId: 'pr2', branchId: 'b1', weekday: 4, startTime: '09:00', endTime: '17:00' },
]

const MOCK_TIMEOFFS: TimeOff[] = [
  { id: 'to1', tenantId: 't1', professionalId: 'pr1', startDate: '2026-04-01', endDate: '2026-04-05', reason: 'Annual leave' },
  { id: 'to2', tenantId: 't1', professionalId: 'pr2', startDate: '2026-03-25', endDate: '2026-03-26', reason: 'Medical conference' },
]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const BRANCHES = ['Main Branch', 'Downtown Clinic', 'Westside Location']

// ── Schedule Editor ────────────────────────────────────────────────────────────

function ScheduleEditor({
  professionalId,
  schedules,
  onSave,
}: {
  professionalId: string
  schedules: ProfessionalSchedule[]
  onSave: (updated: ProfessionalSchedule[]) => void
}) {
  const mine = schedules.filter(s => s.professionalId === professionalId)
  const [rows, setRows] = useState(
    WEEKDAYS.map((_, idx) => {
      const existing = mine.find(s => s.weekday === idx)
      return { weekday: idx, active: !!existing, startTime: existing?.startTime ?? '08:00', endTime: existing?.endTime ?? '17:00' }
    })
  )

  const toggle = (idx: number) =>
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, active: !r.active } : r)))

  const update = (idx: number, field: 'startTime' | 'endTime', val: string) =>
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))

  const handleSave = () => {
    const updated: ProfessionalSchedule[] = rows
      .filter(r => r.active)
      .map((r, i) => ({
        id:             mine.find(s => s.weekday === r.weekday)?.id ?? `sched-${Date.now()}-${i}`,
        tenantId:       't1',
        professionalId,
        branchId:       'b1',
        weekday:        r.weekday,
        startTime:      r.startTime,
        endTime:        r.endTime,
      }))
    onSave(updated)
  }

  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.weekday} className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`day-${professionalId}-${r.weekday}`}
            checked={r.active}
            onChange={() => toggle(r.weekday)}
            className="h-4 w-4 rounded border"
          />
          <label htmlFor={`day-${professionalId}-${r.weekday}`} className="text-sm w-24 shrink-0">
            {WEEKDAYS[r.weekday]}
          </label>
          {r.active ? (
            <>
              <input type="time" value={r.startTime} onChange={e => update(r.weekday, 'startTime', e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-background" aria-label={`${WEEKDAYS[r.weekday]} start time`} />
              <span className="text-muted-foreground text-sm">–</span>
              <input type="time" value={r.endTime} onChange={e => update(r.weekday, 'endTime', e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-background" aria-label={`${WEEKDAYS[r.weekday]} end time`} />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Day off</span>
          )}
        </div>
      ))}
      <Button size="sm" onClick={handleSave} className="mt-2">Save Schedule</Button>
    </div>
  )
}

// ── Time Off Manager ───────────────────────────────────────────────────────────

function TimeOffManager({
  professionalId,
  timeOffs,
  onAdd,
  onRemove,
}: {
  professionalId: string
  timeOffs: TimeOff[]
  onAdd: (t: TimeOff) => void
  onRemove: (id: string) => void
}) {
  const mine = timeOffs.filter(t => t.professionalId === professionalId)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [reason,    setReason]    = useState('')

  const handleAdd = () => {
    if (!startDate || !endDate) return
    onAdd({ id: `to-${Date.now()}`, tenantId: 't1', professionalId, startDate, endDate, reason })
    setStartDate(''); setEndDate(''); setReason('')
  }

  return (
    <div className="space-y-3">
      {mine.length === 0 ? (
        <p className="text-xs text-muted-foreground">No time-off scheduled.</p>
      ) : (
        <div className="space-y-1">
          {mine.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-1.5">
              <span className="text-sm">{t.startDate} – {t.endDate}</span>
              <span className="text-xs text-muted-foreground flex-1 mx-3 truncate">{t.reason}</span>
              <button onClick={() => onRemove(t.id)} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1"><Label className="text-xs">Start</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm h-8" /></div>
        <div className="space-y-1"><Label className="text-xs">End</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm h-8" /></div>
        <div className="space-y-1"><Label className="text-xs">Reason</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Annual leave" className="text-sm h-8" /></div>
      </div>
      <Button size="sm" variant="outline" onClick={handleAdd}>+ Add Time Off</Button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

type AddForm = { name: string; specialization: string; branch: string; slotDurationMins: number; bio: string }
type EditForm = { specialization: string; bio: string; slotDurationMins: number }
type SheetMode = 'add' | 'edit' | null

const EMPTY_ADD: AddForm = { name: '', specialization: '', branch: BRANCHES[0], slotDurationMins: 30, bio: '' }
const EMPTY_EDIT: EditForm = { specialization: '', bio: '', slotDurationMins: 30 }

export function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>(MOCK_PROFESSIONALS)
  const [schedules,     setSchedules]     = useState<ProfessionalSchedule[]>(MOCK_SCHEDULES)
  const [timeOffs,      setTimeOffs]      = useState<TimeOff[]>(MOCK_TIMEOFFS)

  const [expandedId,          setExpandedId]          = useState<string | null>(null)
  const [activeTab,           setActiveTab]           = useState<'profile' | 'schedule' | 'timeoff'>('profile')
  const [branchFilter,        setBranchFilter]        = useState('all')
  const [specializationFilter, setSpecializationFilter] = useState('all')

  const [sheetMode,    setSheetMode]    = useState<SheetMode>(null)
  const [sheetTarget,  setSheetTarget]  = useState<Professional | null>(null)
  const [addForm,      setAddForm]      = useState<AddForm>(EMPTY_ADD)
  const [editForm,     setEditForm]     = useState<EditForm>(EMPTY_EDIT)

  const uniqueSpecializations = [...new Set(professionals.map(p => p.specialization))].sort()

  const filtered = professionals.filter(p =>
    (branchFilter === 'all' || p.branch === branchFilter) &&
    (specializationFilter === 'all' || p.specialization === specializationFilter)
  )

  const handleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setActiveTab('profile')
  }

  const openEdit = (p: Professional) => {
    setSheetTarget(p)
    setEditForm({ specialization: p.specialization, bio: p.bio ?? '', slotDurationMins: p.slotDurationMins })
    setSheetMode('edit')
  }

  const saveEdit = () => {
    if (!sheetTarget) return
    setProfessionals(prev => prev.map(p => p.id === sheetTarget.id ? { ...p, ...editForm } : p))
    setSheetMode(null)
  }

  const toggleActive = (id: string) =>
    setProfessionals(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))

  const handleDelete = (id: string) => {
    setProfessionals(prev => prev.filter(p => p.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleScheduleSave = (professionalId: string, updated: ProfessionalSchedule[]) => {
    setSchedules(prev => [...prev.filter(s => s.professionalId !== professionalId), ...updated])
  }

  const handleAddProfessional = () => {
    if (!addForm.name.trim() || !addForm.specialization.trim()) return
    setProfessionals(prev => [...prev, {
      id:               `pr-${Date.now()}`,
      tenantId:         't1',
      userId:           `u-${Date.now()}`,
      name:             addForm.name,
      specialization:   addForm.specialization,
      branch:           addForm.branch,
      slotDurationMins: addForm.slotDurationMins,
      bio:              addForm.bio,
      isActive:         true,
    }])
    setAddForm(EMPTY_ADD)
    setSheetMode(null)
  }

  const activeCount   = professionals.filter(p => p.isActive).length
  const inactiveCount = professionals.length - activeCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professionals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activeCount} active · {inactiveCount} inactive</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Specialization:</label>
            <select
              aria-label="Filter by specialization"
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
              value={specializationFilter}
              onChange={e => setSpecializationFilter(e.target.value)}
            >
              <option value="all">All specializations</option>
              {uniqueSpecializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Branch:</label>
            <select
              aria-label="Filter by branch"
              className="border rounded-md px-2 py-1.5 text-sm bg-background"
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
            >
              <option value="all">All branches</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={() => { setAddForm(EMPTY_ADD); setSheetMode('add') }}>
            + Add Professional
          </Button>
        </div>
      </div>

      {/* Professional list */}
      <div className="space-y-2">
        {filtered.map(p => {
          const isExpanded = expandedId === p.id
          return (
            <Card key={p.id} className={`transition-shadow ${isExpanded ? 'shadow-md' : ''}`}>
              {/* Row */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleExpand(p.id)}
                role="button"
                aria-expanded={isExpanded}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">{p.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.specialization} · {p.branch}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{p.slotDurationMins} min slots</span>
                  <Badge variant={p.isActive ? 'default' : 'secondary'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(p) }}>
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleActive(p.id) }}>
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-muted-foreground text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <CardContent className="border-t pt-4 pb-4">
                  <div className="flex gap-1 mb-4 border-b pb-2">
                    {(['profile', 'schedule', 'timeoff'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 text-xs font-medium rounded-t transition-colors capitalize ${
                          activeTab === tab
                            ? 'bg-background border border-b-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab === 'timeoff' ? 'Time Off' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'profile' && (
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Specialization:</span> {p.specialization}</p>
                      <p><span className="font-medium">Slot Duration:</span> {p.slotDurationMins} minutes</p>
                      <p><span className="font-medium">Bio:</span> {p.bio || <span className="text-muted-foreground">No bio set</span>}</p>
                    </div>
                  )}

                  {activeTab === 'schedule' && (
                    <ScheduleEditor
                      professionalId={p.id}
                      schedules={schedules}
                      onSave={updated => handleScheduleSave(p.id, updated)}
                    />
                  )}

                  {activeTab === 'timeoff' && (
                    <TimeOffManager
                      professionalId={p.id}
                      timeOffs={timeOffs}
                      onAdd={t => setTimeOffs(prev => [...prev, t])}
                      onRemove={id => setTimeOffs(prev => prev.filter(t => t.id !== id))}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No professionals found for the selected branch.
          </CardContent>
        </Card>
      )}

      {/* Add Sheet */}
      <Sheet open={sheetMode === 'add'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Professional</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input placeholder="e.g. Dr. Jane Smith" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Specialization</Label>
              <Input placeholder="e.g. Cardiology" value={addForm.specialization} onChange={e => setAddForm(f => ({ ...f, specialization: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Branch</Label>
              <select aria-label="Branch" className="border rounded-md px-3 py-2 text-sm bg-background w-full" value={addForm.branch} onChange={e => setAddForm(f => ({ ...f, branch: e.target.value }))}>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slot Duration (mins)</Label>
              <Input type="number" min={10} step={5} value={addForm.slotDurationMins} onChange={e => setAddForm(f => ({ ...f, slotDurationMins: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bio (optional)</Label>
              <textarea
                className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
                rows={3}
                placeholder="Brief bio…"
                value={addForm.bio}
                onChange={e => setAddForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleAddProfessional}>Add Professional</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={sheetMode === 'edit'} onOpenChange={open => !open && setSheetMode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Profile — {sheetTarget?.name}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Specialization</Label>
              <Input value={editForm.specialization} onChange={e => setEditForm(f => ({ ...f, specialization: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slot Duration (mins)</Label>
              <Input type="number" min={10} step={5} value={editForm.slotDurationMins} onChange={e => setEditForm(f => ({ ...f, slotDurationMins: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bio</Label>
              <textarea
                className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
                rows={3}
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={saveEdit}>Save Profile</Button>
            <Button variant="outline" onClick={() => setSheetMode(null)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
