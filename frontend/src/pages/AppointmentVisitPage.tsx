import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X, Eye, EyeOff } from 'lucide-react'
import { MOCK_PATIENTS } from '@/components/patients/PatientForm'
import { INITIAL_SERVICES } from '@/pages/SettingsPage'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_VISIT_APPOINTMENTS: Record<string, {
  id: string; patientId: string; patientName: string; date: string
  startTime: string; durationMins: number; type: string; professionalName: string
}> = {
  'a10': { id: 'a10', patientId: 'pt1', patientName: 'John Doe',      date: '2026-03-18', startTime: '08:30', durationMins: 30, type: 'Follow-up',    professionalName: 'Dr. Sarah Kim'  },
  'a11': { id: 'a11', patientId: 'pt2', patientName: 'Maria Chen',    date: '2026-03-18', startTime: '09:30', durationMins: 30, type: 'Consultation', professionalName: 'Dr. James Park' },
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

// Mock preview content keyed by record type
const MOCK_PREVIEW_CONTENT: Record<string, { label: string; rows: [string, string, string][] }> = {
  'Blood Work': {
    label: 'Laboratory Result',
    rows: [
      ['Hemoglobin',      '13.8 g/dL',  'Normal (12.0–17.5)'],
      ['WBC',             '7.2 × 10³',  'Normal (4.5–11.0)' ],
      ['Platelets',       '245 × 10³',  'Normal (150–400)'  ],
      ['Hematocrit',      '41.5%',      'Normal (36–52%)'   ],
      ['RBC',             '4.7 × 10⁶',  'Normal (4.5–5.9)'  ],
    ],
  },
  'Urinalysis': {
    label: 'Urinalysis Result',
    rows: [
      ['Color',           'Yellow',     'Normal'            ],
      ['Clarity',         'Clear',      'Normal'            ],
      ['pH',              '6.0',        'Normal (4.5–8.0)'  ],
      ['Protein',         'Negative',   'Normal'            ],
      ['Glucose',         'Negative',   'Normal'            ],
      ['WBC',             '0–2 /hpf',   'Normal (0–5)'      ],
    ],
  },
  'Cardiology': {
    label: 'ECG Interpretation',
    rows: [
      ['Rate',            '72 bpm',     'Normal'            ],
      ['Rhythm',          'Sinus',      'Regular'           ],
      ['PR Interval',     '160 ms',     'Normal (<200 ms)'  ],
      ['QRS Duration',    '88 ms',      'Normal (<120 ms)'  ],
      ['QTc',             '420 ms',     'Normal (<450 ms)'  ],
    ],
  },
}

interface PastVisit { id: string; date: string; type: string; professional: string; notes: string; status: string }

const MOCK_HISTORY: Record<string, PastVisit[]> = {
  'pt1': [
    { id: 'h1', date: '2026-02-15', type: 'Consultation', professional: 'Dr. Sarah Kim',  notes: 'Routine checkup. BP 120/80. No abnormalities detected.',    status: 'completed' },
    { id: 'h2', date: '2026-01-10', type: 'Follow-up',    professional: 'Dr. Sarah Kim',  notes: 'Follow-up on hypertension meds. Dosage adjusted.',          status: 'completed' },
    { id: 'h3', date: '2025-11-20', type: 'Lab Review',   professional: 'Dr. James Park', notes: 'CBC results reviewed. Mild anemia noted. Iron supplement prescribed.', status: 'completed' },
  ],
  'pt2': [
    { id: 'h5', date: '2026-02-28', type: 'Consultation', professional: 'Dr. James Park', notes: 'Cardiology review. Lipid panel ordered.',  status: 'completed' },
    { id: 'h6', date: '2025-12-15', type: 'Follow-up',    professional: 'Dr. James Park', notes: 'Post-procedure follow-up. Healing well.', status: 'completed' },
  ],
  'pt3': [
    { id: 'h7', date: '2026-03-01', type: 'Lab Review',   professional: 'Dr. Liu Wei', notes: 'Diabetes management. A1C slightly elevated. Diet counseled.', status: 'completed' },
    { id: 'h8', date: '2026-01-18', type: 'Consultation', professional: 'Dr. Liu Wei', notes: 'General wellness visit.', status: 'completed' },
  ],
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem { id: string; description: string; qty: number; unitPrice: number }
interface Prescription { id: string; medication: string; dosage: string; frequency: string; instructions: string }

const QUICK_ITEMS = INITIAL_SERVICES
  .filter(s => s.isActive)
  .map(s => ({ label: s.name, price: s.price }))

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'As needed']

function minsToTime(n: number): string {
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}
function timeToMins(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m }

// ── Tab: Clinical Notes ────────────────────────────────────────────────────────

function ClinicalNotesTab({
  appointmentId, notes, onChange,
}: { appointmentId: string; notes: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Clinical notes for appointment {appointmentId}. These are part of the patient's medical record.
      </p>
      <textarea
        className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        rows={10}
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder="Record clinical observations, diagnosis, treatment plan, recommendations…"
        aria-label="Clinical notes"
      />
    </div>
  )
}

// ── Tab: Prescription ─────────────────────────────────────────────────────────

function PrescriptionTab({
  patientName, prescriptions, onChange,
}: { patientName: string; prescriptions: Prescription[]; onChange: (v: Prescription[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ medication: '', dosage: '', frequency: 'Once daily', instructions: '' })
  const [formError, setFormError] = useState('')

  const setField = (field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (formError) setFormError('')
  }

  const handleAdd = () => {
    if (!form.medication.trim() || !form.dosage.trim()) { setFormError('Medication and dosage are required.'); return }
    onChange([...prescriptions, { id: `rx-${Date.now()}`, ...form }])
    setForm({ medication: '', dosage: '', frequency: 'Once daily', instructions: '' })
    setShowForm(false)
  }

  const removeRx = (id: string) => onChange(prescriptions.filter(r => r.id !== id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} for {patientName}</p>
        {!showForm && <Button size="sm" onClick={() => setShowForm(true)}>+ Add Prescription</Button>}
      </div>

      {showForm && (
        <div className="border rounded-md p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">New Prescription</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Medication *</Label>
              <Input value={form.medication} onChange={e => setField('medication', e.target.value)} placeholder="e.g. Amoxicillin" className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dosage *</Label>
              <Input value={form.dosage} onChange={e => setField('dosage', e.target.value)} placeholder="e.g. 500mg" className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frequency</Label>
              <select
                className="border rounded-md px-2 py-1.5 text-sm bg-background w-full h-8"
                value={form.frequency}
                onChange={e => setField('frequency', e.target.value)}
              >
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Instructions (optional)</Label>
              <Input value={form.instructions} onChange={e => setField('instructions', e.target.value)} placeholder="e.g. Take with food, avoid alcohol" className="h-8" />
            </div>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</Button>
          </div>
        </div>
      )}

      {prescriptions.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No prescriptions added yet.</p>
      ) : (
        <div className="space-y-2">
          {prescriptions.map(rx => (
            <div key={rx.id} className="flex items-start justify-between bg-muted/30 rounded-md px-4 py-3 gap-3">
              <div>
                <p className="text-sm font-medium">{rx.medication} — {rx.dosage}</p>
                <p className="text-xs text-muted-foreground">{rx.frequency}{rx.instructions ? ` · ${rx.instructions}` : ''}</p>
              </div>
              <button onClick={() => removeRx(rx.id)} className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Lab Records ──────────────────────────────────────────────────────────

function LabRecordPreview({ record, onClose }: { record: LabRecord; onClose: () => void }) {
  const mock = MOCK_PREVIEW_CONTENT[record.type]

  return (
    <div className="mt-3 border rounded-md bg-background shadow-sm">
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{record.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{record.type}</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="text-xs text-primary hover:underline">Download</a>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview body */}
      <div className="p-4 space-y-3">
        <div className="flex gap-6 text-xs text-muted-foreground">
          <span>Date: <strong className="text-foreground">{record.uploadedAt}</strong></span>
          <span>Processed by: <strong className="text-foreground">{record.uploadedBy}</strong></span>
        </div>

        {mock ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mock.label}</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-1.5 pr-4 font-medium">Parameter</th>
                  <th className="text-left py-1.5 pr-4 font-medium">Result</th>
                  <th className="text-left py-1.5 font-medium">Reference Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mock.rows.map(([param, result, ref]) => (
                  <tr key={param}>
                    <td className="py-1.5 pr-4 text-muted-foreground">{param}</td>
                    <td className="py-1.5 pr-4 font-medium">{result}</td>
                    <td className="py-1.5 text-xs text-muted-foreground">{ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Generic file preview for Imaging / Uploaded / other types
          <div className="rounded-md bg-muted/40 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 py-10">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {record.type === 'Imaging'
                ? 'Imaging file — click Download to open in DICOM viewer'
                : 'File preview not available — click Download to view'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function LabRecordsTab({
  records, onRecordsChange,
}: { records: LabRecord[]; onRecordsChange: (v: LabRecord[]) => void }) {
  const [viewingId, setViewingId] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onRecordsChange([
      { id: `lr-${Date.now()}`, name: file.name, type: 'Uploaded', uploadedAt: new Date().toISOString().slice(0, 10), uploadedBy: 'Dr. (Current)' },
      ...records,
    ])
    e.target.value = ''
  }

  const toggleView = (id: string) => setViewingId(prev => prev === id ? null : id)

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
        <div className="space-y-1">
          {records.map(r => (
            <div key={r.id}>
              <div className="flex items-center justify-between bg-muted/30 rounded-md px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.type} · {r.uploadedAt} · {r.uploadedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <button
                    onClick={() => toggleView(r.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    aria-label={viewingId === r.id ? 'Hide preview' : 'Quick view'}
                  >
                    {viewingId === r.id
                      ? <><EyeOff className="h-3.5 w-3.5" /> Hide</>
                      : <><Eye className="h-3.5 w-3.5" /> View</>
                    }
                  </button>
                  <a href="#" className="text-xs text-muted-foreground hover:underline">Download</a>
                </div>
              </div>

              {viewingId === r.id && (
                <LabRecordPreview record={r} onClose={() => setViewingId(null)} />
              )}
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

function BillingTab({
  appointmentId: _appointmentId, patientName,
  items, onItemsChange,
  waivedFee, onWaivedFeeChange,
}: {
  appointmentId: string; patientName: string
  items: LineItem[]; onItemsChange: (v: LineItem[]) => void
  waivedFee: boolean; onWaivedFeeChange: (v: boolean) => void
}) {
  const [quickAdd,       setQuickAdd]       = useState('')
  const [invoiceCreated, setInvoiceCreated] = useState<string | null>(null)

  const total = waivedFee ? 0 : items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

  const addBlankRow = () =>
    onItemsChange([...items, { id: `li-${Date.now()}`, description: '', qty: 1, unitPrice: 0 }])

  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    onItemsChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  const removeItem = (id: string) => onItemsChange(items.filter(i => i.id !== id))

  const handleQuickAdd = (label: string) => {
    const qi = QUICK_ITEMS.find(q => q.label === label)
    if (!qi) return
    onItemsChange([...items, { id: `li-${Date.now()}`, description: qi.label, qty: 1, unitPrice: qi.price }])
    setQuickAdd('')
  }

  const handleCreateInvoice = () => {
    if (!waivedFee && (total === 0 || items.length === 0)) return
    const num = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    setInvoiceCreated(num)
  }

  if (invoiceCreated) {
    return (
      <div className="py-8 text-center space-y-2">
        <p className="text-base font-semibold text-green-600">
          {waivedFee ? 'Fee Waived — Invoice Created' : 'Draft Invoice Created'}
        </p>
        <p className="text-sm text-muted-foreground">Invoice {invoiceCreated} has been saved as a draft for {patientName}.</p>
        <p className="text-sm font-medium">{waivedFee ? 'Total: ₱0 (waived)' : `Total: ₱${total.toLocaleString()}`}</p>
        <Button size="sm" variant="outline" onClick={() => { setInvoiceCreated(null); onItemsChange([]); onWaivedFeeChange(false) }} className="mt-2">
          Add Another
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Waive fee toggle */}
      <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border">
        <input
          id="waive-fee"
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={waivedFee}
          onChange={e => onWaivedFeeChange(e.target.checked)}
        />
        <label htmlFor="waive-fee" className="text-sm cursor-pointer select-none">
          Waive fee for this appointment
          {waivedFee && <span className="ml-2 text-xs text-muted-foreground">(Invoice will be created at ₱0)</span>}
        </label>
      </div>

      {!waivedFee && (
        <>
          <div className="flex items-center gap-2">
            <select
              aria-label="Quick add item"
              className="border rounded-md px-2 py-1.5 text-sm bg-background flex-1"
              value={quickAdd}
              onChange={e => { if (e.target.value) handleQuickAdd(e.target.value) }}
            >
              <option value="">Quick add from services…</option>
              {QUICK_ITEMS.map(q => <option key={q.label} value={q.label}>{q.label} — ₱{q.price}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={addBlankRow}>+ Add Row</Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No charges yet. Add items above.</p>
          ) : (
            <div className="space-y-2">
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
                  <Input type="number" min={1} value={i.qty}
                    onChange={e => updateItem(i.id, 'qty', Number(e.target.value))}
                    className="h-8 text-sm text-right" aria-label="Quantity" />
                  <Input type="number" min={0} value={i.unitPrice}
                    onChange={e => updateItem(i.id, 'unitPrice', Number(e.target.value))}
                    className="h-8 text-sm text-right" aria-label="Unit price" />
                  <button onClick={() => removeItem(i.id)} className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex justify-end border-t pt-2 mt-1">
                <p className="text-sm font-semibold">Total: ₱{total.toLocaleString()}</p>
              </div>
            </div>
          )}
        </>
      )}

      <Button size="sm" onClick={handleCreateInvoice} disabled={!waivedFee && (items.length === 0 || total === 0)}>
        Create Draft Invoice
      </Button>
      {!waivedFee && items.length > 0 && total === 0 && (
        <p className="text-xs text-destructive">All line items have ₱0 total — add prices before creating invoice.</p>
      )}
    </div>
  )
}

// ── Tab: Internal Notes ───────────────────────────────────────────────────────

function InternalNotesTab({
  appointmentId, notes, onChange,
}: { appointmentId: string; notes: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Internal staff notes for appointment {appointmentId}. These are <strong>not visible to the patient</strong>.
      </p>
      <textarea
        className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        rows={8}
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder="Staff-only observations, reminders, handover notes…"
        aria-label="Internal notes"
      />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type VisitTab = 'clinical' | 'rx' | 'lab' | 'history' | 'billing' | 'internal'

const VISIT_TABS: { key: VisitTab; label: string }[] = [
  { key: 'clinical',  label: 'Clinical Notes'  },
  { key: 'rx',        label: 'Prescription'    },
  { key: 'lab',       label: 'Lab Records'     },
  { key: 'history',   label: 'Patient History' },
  { key: 'billing',   label: 'Billing'         },
  { key: 'internal',  label: 'Internal Notes'  },
]

export function AppointmentVisitPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()

  const appt = appointmentId ? MOCK_VISIT_APPOINTMENTS[appointmentId] : undefined
  const patient = appt ? MOCK_PATIENTS.find(p => p.id === appt.patientId) : undefined

  // ── Per-visit state (lifted so it survives tab switches) ──
  const [activeTab,     setActiveTab]     = useState<VisitTab>('clinical')
  const [followUpDate,  setFollowUpDate]  = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [lineItems,     setLineItems]     = useState<LineItem[]>([])
  const [waivedFee,     setWaivedFee]     = useState(false)
  const [labRecords,    setLabRecords]    = useState<LabRecord[]>(
    appt ? (MOCK_LAB_RECORDS[appt.patientId] ?? []) : [],
  )

  // ── Cancel / auto-save UI state ──
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelled,         setCancelled]         = useState(false)
  const [autoSaveLabel,     setAutoSaveLabel]     = useState('')

  if (!appt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-lg font-semibold">Appointment not found</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/appointments')}>Back to Appointments</Button>
      </div>
    )
  }

  const endTime = minsToTime(timeToMins(appt.startTime) + appt.durationMins)

  const handleTabChange = (tab: VisitTab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setAutoSaveLabel('Auto-saved')
    setTimeout(() => setAutoSaveLabel(''), 2000)
  }

  const handleCancelAppointment = () => {
    setCancelled(true)
    setShowCancelConfirm(false)
    setTimeout(() => navigate('/appointments'), 1500)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate('/appointments')} className="text-sm text-muted-foreground hover:text-foreground">
                ← Appointments
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{appt.patientName}</h1>
              {cancelled && <Badge variant="destructive">Cancelled</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {appt.date} · {appt.startTime}–{endTime} · {appt.type} · {appt.professionalName}
            </p>
            {patient && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {patient.gender} · DOB {patient.dob ?? '—'} · {patient.phone ?? '—'}
                {patient.bloodType ? ` · ${patient.bloodType}` : ''}
                {patient.allergies.length > 0 && (
                  <span className="text-destructive"> · Allergies: {patient.allergies.join(', ')}</span>
                )}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/appointments')}>End Visit</Button>
        </div>

        {/* Follow-up date + cancel row */}
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Follow-up Date (optional)</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="h-8 text-sm w-44"
              aria-label="Follow-up date"
            />
          </div>

          {!cancelled && !showCancelConfirm && (
            <Button size="sm" variant="destructive" onClick={() => setShowCancelConfirm(true)}>
              Cancel Appointment
            </Button>
          )}

          {showCancelConfirm && (
            <div className="flex items-center gap-2 border border-destructive/40 rounded-md px-3 py-2 bg-destructive/5">
              <p className="text-sm text-destructive font-medium">Cancel this appointment?</p>
              <Button size="sm" variant="destructive" onClick={handleCancelAppointment}>Yes, cancel</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCancelConfirm(false)}>Keep</Button>
            </div>
          )}

          {cancelled && (
            <p className="text-sm text-destructive font-medium">Appointment cancelled — redirecting…</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <div className="flex items-center justify-between border-b">
            <div className="flex gap-0 overflow-x-auto">
              {VISIT_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === t.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {autoSaveLabel && (
              <span className="text-xs text-green-600 font-medium shrink-0 pl-3 pb-2">{autoSaveLabel}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {activeTab === 'clinical' && (
            <ClinicalNotesTab appointmentId={appt.id} notes={clinicalNotes} onChange={setClinicalNotes} />
          )}
          {activeTab === 'rx' && (
            <PrescriptionTab patientName={appt.patientName} prescriptions={prescriptions} onChange={setPrescriptions} />
          )}
          {activeTab === 'lab' && (
            <LabRecordsTab records={labRecords} onRecordsChange={setLabRecords} />
          )}
          {activeTab === 'history' && (
            <PatientHistoryTab patientId={appt.patientId} />
          )}
          {activeTab === 'billing' && (
            <BillingTab
              appointmentId={appt.id}
              patientName={appt.patientName}
              items={lineItems}
              onItemsChange={setLineItems}
              waivedFee={waivedFee}
              onWaivedFeeChange={setWaivedFee}
            />
          )}
          {activeTab === 'internal' && (
            <InternalNotesTab appointmentId={appt.id} notes={internalNotes} onChange={setInternalNotes} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
