import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import type { ClinicHours, SpecialClosure } from '@/types'

// ── Holiday sync ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'PH', name: 'Philippines' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'CA', name: 'Canada' },
  { code: 'NZ', name: 'New Zealand' },
]

interface NagerHoliday { date: string; localName: string; name: string }

async function fetchPublicHolidays(countryCode: string, year: number): Promise<NagerHoliday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
  if (!res.ok) throw new Error(`Failed to fetch holidays: ${res.status}`)
  return res.json()
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const BRANCHES = [
  { id: 'b1', name: 'Main Branch' },
  { id: 'b2', name: 'Downtown Clinic' },
  { id: 'b3', name: 'Westside Location' },
]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function makeHours(branchId: string, closedDays: number[] = [5, 6]): ClinicHours[] {
  return WEEKDAYS.map((_, idx) => ({
    id:        `ch-${branchId}-${idx}`,
    tenantId:  't1',
    branchId,
    weekday:   idx,
    openTime:  '08:00',
    closeTime: '18:00',
    isClosed:  closedDays.includes(idx),
  }))
}

const INITIAL_HOURS: Record<string, ClinicHours[]> = {
  b1: makeHours('b1', [6]),
  b2: makeHours('b2', [5, 6]),
  b3: makeHours('b3', [3, 5, 6]),
}

const INITIAL_CLOSURES: SpecialClosure[] = [
  { id: 'sc1', tenantId: 't1', branchId: 'b1', date: '2026-04-07', reason: 'Public Holiday — Good Friday' },
  { id: 'sc2', tenantId: 't1', branchId: 'b1', date: '2026-04-10', reason: 'Public Holiday — Easter Monday' },
  { id: 'sc3', tenantId: 't1', branchId: 'b2', date: '2026-04-07', reason: 'Public Holiday — Good Friday' },
]

// ── Read-only Hours View ───────────────────────────────────────────────────────

function HoursView({ branchId, hours }: { branchId: string; hours: ClinicHours[] }) {
  const mine = hours.filter(h => h.branchId === branchId)
  return (
    <div className="space-y-1" role="grid" aria-label="Clinic hours grid">
      <div className="grid grid-cols-[7rem_6rem_5rem_5rem] gap-3 px-2 pb-1 border-b">
        <span className="text-xs font-medium text-muted-foreground">Day</span>
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <span className="text-xs font-medium text-muted-foreground">Opens</span>
        <span className="text-xs font-medium text-muted-foreground">Closes</span>
      </div>
      {mine.map(h => (
        <div key={h.weekday} className={`grid grid-cols-[7rem_6rem_5rem_5rem] gap-3 items-center px-2 py-1.5 rounded ${h.isClosed ? 'opacity-60' : ''}`}>
          <span className="text-sm font-medium">{WEEKDAYS[h.weekday]}</span>
          <span className={`text-xs font-medium ${h.isClosed ? 'text-muted-foreground' : 'text-green-600'}`}>
            {h.isClosed ? 'Closed' : 'Open'}
          </span>
          <span className="text-sm text-muted-foreground">{h.isClosed ? '—' : h.openTime}</span>
          <span className="text-sm text-muted-foreground">{h.isClosed ? '—' : h.closeTime}</span>
        </div>
      ))}
    </div>
  )
}

// ── Editable Hours Grid ────────────────────────────────────────────────────────

function HoursGrid({
  branchId,
  hours,
  onChange,
}: {
  branchId: string
  hours: ClinicHours[]
  onChange: (updated: ClinicHours[]) => void
}) {
  const mine = hours.filter(h => h.branchId === branchId)

  const update = (weekday: number, field: Partial<ClinicHours>) => {
    onChange(mine.map(h => h.weekday === weekday ? { ...h, ...field } : h))
  }

  return (
    <div className="space-y-1" role="grid" aria-label="Clinic hours grid">
      <div className="grid grid-cols-[7rem_6rem_5rem_5rem] gap-3 px-2 pb-1 border-b">
        <span className="text-xs font-medium text-muted-foreground">Day</span>
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <span className="text-xs font-medium text-muted-foreground">Opens</span>
        <span className="text-xs font-medium text-muted-foreground">Closes</span>
      </div>
      {mine.map(h => (
        <div key={h.weekday} className={`grid grid-cols-[7rem_6rem_5rem_5rem] gap-3 items-center px-2 py-1.5 rounded ${h.isClosed ? 'opacity-60' : ''}`}>
          <span className="text-sm font-medium">{WEEKDAYS[h.weekday]}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!h.isClosed}
              onChange={() => update(h.weekday, { isClosed: !h.isClosed })}
              className="h-4 w-4 rounded border"
              aria-label={`${WEEKDAYS[h.weekday]} open`}
            />
            <span className={`text-xs font-medium ${h.isClosed ? 'text-muted-foreground' : 'text-green-600'}`}>
              {h.isClosed ? 'Closed' : 'Open'}
            </span>
          </label>
          <input
            type="time"
            value={h.openTime}
            disabled={h.isClosed}
            onChange={e => update(h.weekday, { openTime: e.target.value })}
            className="border rounded px-2 py-1 text-sm bg-background disabled:opacity-40"
            aria-label={`${WEEKDAYS[h.weekday]} open time`}
          />
          <input
            type="time"
            value={h.closeTime}
            disabled={h.isClosed}
            onChange={e => update(h.weekday, { closeTime: e.target.value })}
            className="border rounded px-2 py-1 text-sm bg-background disabled:opacity-40"
            aria-label={`${WEEKDAYS[h.weekday]} close time`}
          />
        </div>
      ))}
    </div>
  )
}

// ── Special Closures ───────────────────────────────────────────────────────────

function SpecialClosuresList({
  branchId,
  closures,
  editing,
  onAdd,
  onRemove,
}: {
  branchId: string
  closures: SpecialClosure[]
  editing: boolean
  onAdd: (c: SpecialClosure) => void
  onRemove: (id: string) => void
}) {
  const mine = closures.filter(c => c.branchId === branchId).sort((a, b) => a.date.localeCompare(b.date))
  const [date,   setDate]   = useState('')
  const [reason, setReason] = useState('')

  const handleAdd = () => {
    if (!date) return
    onAdd({ id: `sc-${Date.now()}`, tenantId: 't1', branchId, date, reason })
    setDate(''); setReason('')
  }

  return (
    <div className="space-y-3">
      {mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">No special closures scheduled.</p>
      ) : (
        <div className="space-y-1.5">
          {mine.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2">
              <div>
                <p className="text-sm font-medium">{c.date}</p>
                <p className="text-xs text-muted-foreground">{c.reason || 'No reason given'}</p>
              </div>
              {editing && (
                <button onClick={() => onRemove(c.id)} className="text-xs text-destructive hover:underline ml-4">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm w-36" aria-label="Closure date" />
          </div>
          <div className="space-y-1 flex-1 min-w-40">
            <Label className="text-xs">Reason</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Public holiday, emergency, etc." className="h-8 text-sm" aria-label="Closure reason" />
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd} className="mb-0.5">+ Add Closure</Button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ClinicHoursPage() {
  const [activeBranch, setActiveBranch] = useState(BRANCHES[0].id)
  const [hours,        setHours]        = useState(INITIAL_HOURS)
  const [closures,     setClosures]     = useState<SpecialClosure[]>(INITIAL_CLOSURES)
  const [editing,      setEditing]      = useState(false)
  // Draft state for edits that haven't been saved yet
  const [draftHours,   setDraftHours]   = useState(INITIAL_HOURS)

  // Holiday sync
  const [holidayCountry, setHolidayCountry] = useState('PH')
  const [syncing,        setSyncing]        = useState(false)
  const [syncMessage,    setSyncMessage]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSyncHolidays = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const year = new Date().getFullYear()
      const holidays = await fetchPublicHolidays(holidayCountry, year)
      // Compute new holidays outside the state updater to avoid side-effect duplication
      const existing = closures.filter(c => c.branchId === activeBranch)
      const toAdd = holidays.filter(h => !existing.some(c => c.date === h.date))
      if (toAdd.length > 0) {
        setClosures(prev => [
          ...prev,
          ...toAdd.map(h => ({ id: `hol-${h.date}-${activeBranch}`, tenantId: 't1', branchId: activeBranch, date: h.date, reason: h.localName || h.name })),
        ])
      }
      setSyncMessage({ type: 'success', text: `Synced ${toAdd.length} holiday${toAdd.length !== 1 ? 's' : ''} for ${year}` })
    } catch {
      setSyncMessage({ type: 'error', text: 'Failed to fetch holidays. Please try again.' })
    } finally {
      setSyncing(false)
    }
  }

  const startEdit = () => {
    setDraftHours({ ...hours })
    setEditing(true)
  }

  const handleSave = () => {
    setHours({ ...draftHours })
    setEditing(false)
  }

  const handleCancel = () => {
    setDraftHours({ ...hours })
    setEditing(false)
  }

  const handleHoursChange = (updated: ClinicHours[]) => {
    setDraftHours(prev => ({ ...prev, [activeBranch]: updated }))
  }

  const branchName = BRANCHES.find(b => b.id === activeBranch)?.name ?? ''
  const displayHours = editing ? draftHours : hours
  const openDays = (displayHours[activeBranch] ?? []).filter(h => !h.isClosed).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clinic Hours</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Set operating hours and special closures per branch</p>
      </div>

      {/* Branch tabs */}
      <div className="flex gap-1 border-b">
        {BRANCHES.map(b => (
          <button
            key={b.id}
            onClick={() => { setActiveBranch(b.id); if (editing) { setDraftHours(prev => ({ ...hours, ...prev })) } }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeBranch === b.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Hours card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{branchName} — Weekly Hours</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{openDays} days open per week</span>
              {!editing && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} title="Edit hours">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <>
              <HoursGrid
                branchId={activeBranch}
                hours={draftHours[activeBranch] ?? []}
                onChange={handleHoursChange}
              />
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={handleSave}>Save Hours</Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </>
          ) : (
            <HoursView
              branchId={activeBranch}
              hours={hours[activeBranch] ?? []}
            />
          )}
        </CardContent>
      </Card>

      {/* Special closures card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">{branchName} — Special Closures</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Holiday sync controls */}
              <select
                aria-label="Country for holiday sync"
                className="border rounded-md px-2 py-1 text-xs bg-background"
                value={holidayCountry}
                onChange={e => { setHolidayCountry(e.target.value); setSyncMessage(null) }}
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={handleSyncHolidays}
                disabled={syncing}
              >
                {syncing ? 'Syncing…' : 'Sync Holidays'}
              </Button>
              {!editing && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} title="Edit closures">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          {syncMessage && (
            <p className={`text-xs mt-1 ${syncMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {syncMessage.text}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <SpecialClosuresList
            branchId={activeBranch}
            closures={closures}
            editing={editing}
            onAdd={c => setClosures(prev => [...prev, c])}
            onRemove={id => setClosures(prev => prev.filter(c => c.id !== id))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
