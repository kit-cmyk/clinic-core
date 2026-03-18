import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X } from 'lucide-react'
import { MOCK_PATIENTS } from '@/components/patients/PatientForm'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_VISIT_APPOINTMENTS: Record<string, {
  id: string; patientId: string; patientName: string; date: string
  startTime: string; durationMins: number; type: string; professionalName: string
}> = {
  'a10': { id: 'a10', patientId: 'pt1', patientName: 'John Doe',      date: '2026-03-18', startTime: '08:30', durationMins: 30, type: 'Follow-up',    professionalName: 'Dr. Sarah Kim'  },
  'a11': { id: 'a11', patientId: 'pt2', patientName: 'Jane Smith',    date: '2026-03-18', startTime: '09:30', durationMins: 30, type: 'Consultation', professionalName: 'Dr. James Park' },
  'a12': { id: 'a12', patientId: 'pt3', patientName: 'Carlos Rivera', date: '2026-03-18', startTime: '11:00', durationMins: 30, type: 'Lab Review',   professionalName: 'Dr. Liu Wei'    },
}

interface LabRecord { id: string; name: string; type: string; uploadedAt: string; uploadedBy: string }

const MOCK_LAB_RECORDS: Record<string, LabRecord[]> = {
  'pt1': [
    { id: 'lr1', name: 'CBC Complete Blood Count',   type: 'Blood Work', uploadedAt: '2026-02-10', uploadedBy: 'Lab Tech A' },
    { id: 'lr2', name: 'Chest X-Ray Report',         type: 'Imaging',    uploadedAt: '2026-01-25', uploadedBy: 'Lab Tech B' },
    { id: 'lr3', name: 'Urinalysis Results',         type: 'Urinalysis', uploadedAt: '2026-03-01', uploadedBy: 'Lab Tech A' },
  ],
  'pt2': [
    { id: 'lr4', name: 'Lipid Panel',                type: 'Blood Work', uploadedAt: '2026-02-20', uploadedBy: 'Lab Tech B' },
    { id: 'lr5', name: 'ECG Tracing',                type: 'Cardiology', uploadedAt: '2026-03-05', uploadedBy: 'Lab Tech C' },
  ],
  'pt3': [
    { id: 'lr6', name: 'Blood Sugar Fasting',        type: 'Blood Work', uploadedAt: '2026-03-10', uploadedBy: 'Lab Tech A' },
  ],
}

interface PastVisit { id: string; date: string; type: string; professional: string; notes: string; status: string }

const MOCK_HISTORY: Record<string, PastVisit[]> = {
  'pt1': [
    { id: 'h1', date: '2026-02-15', type: 'Consultation', professional: 'Dr. Sarah Kim',  notes: 'Routine checkup. BP 120/80. No abnormalities detected.',    status: 'completed' },
    { id: 'h2', date: '2026-01-10', type: 'Follow-up',    professional: 'Dr. Sarah Kim',  notes: 'Follow-up on hypertension meds. Dosage adjusted.',          status: 'completed' },
    { id: 'h3', date: '2025-11-20', type: 'Lab Review',   professional: 'Dr. James Park', notes: 'CBC results reviewed. Mild anemia noted. Iron supplement prescribed.', status: 'completed' },
    { id: 'h4', date: '2025-09-05', type: 'New Patient',  professional: 'Dr. Sarah Kim',  notes: 'Initial consultation. Full history taken.',                 status: 'completed' },
  ],
  'pt2': [
    { id: 'h5', date: '2026-02-28', type: 'Consultation', professional: 'Dr. James Park', notes: 'Cardiology review. Lipid panel ordered.',                   status: 'completed' },
    { id: 'h6', date: '2025-12-15', type: 'Follow-up',    professional: 'Dr. James Park', notes: 'Post-procedure follow-up. Healing well.',                   status: 'completed' },
  ],
  'pt3': [
    { id: 'h7', date: '2026-03-01', type: 'Lab Review',   professional: 'Dr. Liu Wei',    notes: 'Diabetes management. A1C slightly elevated. Diet counseled.', status: 'completed' },
    { id: 'h8', date: '2026-01-18', type: 'Consultation', professional: 'Dr. Liu Wei',    notes: 'General wellness visit.',                                   status: 'completed' },
  ],
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem { id: string; description: string; qty: number; unitPrice: number }

const QUICK_ITEMS: { label: string; price: number }[] = [
  { label: 'Consultation Fee',    price: 500  },
  { label: 'Lab Processing Fee',  price: 200  },
  { label: 'Injection',           price: 150  },
  { label: 'Dressing',            price: 100  },
  { label: 'ECG',                 price: 350  },
]

function minsToTime(n: number): string {
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}
function timeToMins(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m }

// ── Tab: Lab Records ──────────────────────────────────────────────────────────

function LabRecordsTab({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<LabRecord[]>(MOCK_LAB_RECORDS[patientId] ?? [])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRecords(prev => [
      { id: `lr-${Date.now()}`, name: file.name, type: 'Uploaded', uploadedAt: new Date().toISOString().slice(0, 10), uploadedBy: 'Dr. (Current)' },
      ...prev,
    ])
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        <label className="cursor-pointer">
          <input type="file" className="sr-only" onChange={handleUpload} aria-label="Upload lab record" />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer">
            <Upload className="h-3.5 w-3.5" /> Upload Record
          </span>
        </label>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No lab records for this patient.</p>
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-md px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.type} · {r.uploadedAt} · {r.uploadedBy}</p>
                </div>
              </div>
              <a href="#" className="text-xs text-primary hover:underline ml-4 shrink-0">Download</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Patient History ──────────────────────────────────────────────────────

function PatientHistoryTab({ patientId }: { patientId: string }) {
  const history = (MOCK_HISTORY[patientId] ?? []).slice(0, 5)

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No previous visits on record.</p>
  }

  return (
    <div className="space-y-3">
      {history.map(v => (
        <div key={v.id} className="border-l-2 border-primary/30 pl-4 py-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium">{v.date} — {v.type}</p>
            <Badge variant="secondary" className="text-xs capitalize">{v.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{v.professional}</p>
          <p className="text-sm mt-1">{v.notes}</p>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Billing ──────────────────────────────────────────────────────────────

function BillingTab({ appointmentId, patientName }: { appointmentId: string; patientName: string }) {
  const [items,          setItems]          = useState<LineItem[]>([])
  const [quickAdd,       setQuickAdd]       = useState('')
  const [invoiceCreated, setInvoiceCreated] = useState<string | null>(null)

  const total = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

  const addBlankRow = () =>
    setItems(prev => [...prev, { id: `li-${Date.now()}`, description: '', qty: 1, unitPrice: 0 }])

  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const handleQuickAdd = (label: string) => {
    const qi = QUICK_ITEMS.find(q => q.label === label)
    if (!qi) return
    setItems(prev => [...prev, { id: `li-${Date.now()}`, description: qi.label, qty: 1, unitPrice: qi.price }])
    setQuickAdd('')
  }

  const handleCreateInvoice = () => {
    if (total === 0 || items.length === 0) return
    const num = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    setInvoiceCreated(num)
  }

  if (invoiceCreated) {
    return (
      <div className="py-8 text-center space-y-2">
        <p className="text-base font-semibold text-green-600">Draft Invoice Created</p>
        <p className="text-sm text-muted-foreground">Invoice {invoiceCreated} has been saved as a draft for {patientName}.</p>
        <p className="text-sm font-medium">Total: ₱{total.toLocaleString()}</p>
        <Button size="sm" variant="outline" onClick={() => { setInvoiceCreated(null); setItems([]) }} className="mt-2">
          Add Another
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quick add */}
      <div className="flex items-center gap-2">
        <select
          aria-label="Quick add item"
          className="border rounded-md px-2 py-1.5 text-sm bg-background flex-1"
          value={quickAdd}
          onChange={e => { if (e.target.value) handleQuickAdd(e.target.value) }}
        >
          <option value="">Quick add common item…</option>
          {QUICK_ITEMS.map(q => <option key={q.label} value={q.label}>{q.label} — ₱{q.price}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={addBlankRow}>+ Add Row</Button>
      </div>

      {/* Line items */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No charges yet. Add items above.</p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_4rem_5rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit ₱</span><span />
          </div>
          {items.map(i => (
            <div key={i.id} className="grid grid-cols-[1fr_4rem_5rem_2rem] gap-2 items-center">
              <Input
                value={i.description}
                onChange={e => updateItem(i.id, 'description', e.target.value)}
                placeholder="Description"
                className="h-8 text-sm"
                aria-label="Item description"
              />
              <Input
                type="number"
                min={1}
                value={i.qty}
                onChange={e => updateItem(i.id, 'qty', Number(e.target.value))}
                className="h-8 text-sm text-right"
                aria-label="Quantity"
              />
              <Input
                type="number"
                min={0}
                value={i.unitPrice}
                onChange={e => updateItem(i.id, 'unitPrice', Number(e.target.value))}
                className="h-8 text-sm text-right"
                aria-label="Unit price"
              />
              <button onClick={() => removeItem(i.id)} className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-end border-t pt-2 mt-1">
            <p className="text-sm font-semibold">Total: ₱{total.toLocaleString()}</p>
          </div>
        </div>
      )}

      <Button
        size="sm"
        onClick={handleCreateInvoice}
        disabled={items.length === 0 || total === 0}
      >
        Create Draft Invoice
      </Button>
      {items.length > 0 && total === 0 && (
        <p className="text-xs text-destructive">All line items have ₱0 total — add prices before creating invoice.</p>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type VisitTab = 'lab' | 'history' | 'billing'

export function AppointmentVisitPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<VisitTab>('lab')

  const appt = appointmentId ? MOCK_VISIT_APPOINTMENTS[appointmentId] : undefined
  const patient = appt ? MOCK_PATIENTS.find(p => p.id === appt.patientId) : undefined

  if (!appt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-lg font-semibold">Appointment not found</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/appointments')}>Back to Appointments</Button>
      </div>
    )
  }

  const endTime = minsToTime(timeToMins(appt.startTime) + appt.durationMins)

  const TABS: { key: VisitTab; label: string }[] = [
    { key: 'lab',     label: 'Lab Records'    },
    { key: 'history', label: 'Patient History' },
    { key: 'billing', label: 'Billing'         },
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/appointments')} className="text-sm text-muted-foreground hover:text-foreground">
              ← Appointments
            </button>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{appt.patientName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {appt.date} · {appt.startTime}–{endTime} · {appt.type} · {appt.professionalName}
          </p>
          {patient && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {patient.gender} · DOB {patient.dob} · {patient.phone}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/appointments')}
        >
          End Visit
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <div className="flex gap-1 border-b pb-0">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {activeTab === 'lab'     && <LabRecordsTab     patientId={appt.patientId} />}
          {activeTab === 'history' && <PatientHistoryTab patientId={appt.patientId} />}
          {activeTab === 'billing' && <BillingTab        appointmentId={appt.id} patientName={appt.patientName} />}
        </CardContent>
      </Card>
    </div>
  )
}
