import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X, Eye, EyeOff, ChevronDown, ChevronRight, Send } from 'lucide-react'
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

interface PastVisit {
  id: string; date: string; type: string; professional: string; notes: string; status: string
  prescriptions: { medication: string; dosage: string; frequency: string }[]
  labRecords: { name: string; type: string }[]
}

const MOCK_HISTORY: Record<string, PastVisit[]> = {
  'pt1': [
    {
      id: 'h1', date: '2026-02-15', type: 'Consultation', professional: 'Dr. Sarah Kim', status: 'completed',
      notes: 'Routine checkup. BP 120/80. No abnormalities detected.',
      prescriptions: [{ medication: 'Losartan', dosage: '50mg', frequency: 'Once daily' }],
      labRecords: [{ name: 'CBC Complete Blood Count', type: 'Blood Work' }],
    },
    {
      id: 'h2', date: '2026-01-10', type: 'Follow-up', professional: 'Dr. Sarah Kim', status: 'completed',
      notes: 'Follow-up on hypertension meds. Dosage adjusted.',
      prescriptions: [
        { medication: 'Losartan', dosage: '100mg', frequency: 'Once daily' },
        { medication: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
      ],
      labRecords: [],
    },
    {
      id: 'h3', date: '2025-11-20', type: 'Lab Review', professional: 'Dr. James Park', status: 'completed',
      notes: 'CBC results reviewed. Mild anemia noted. Iron supplement prescribed.',
      prescriptions: [{ medication: 'Ferrous Sulfate', dosage: '325mg', frequency: 'Twice daily' }],
      labRecords: [{ name: 'CBC Complete Blood Count', type: 'Blood Work' }, { name: 'Urinalysis Results', type: 'Urinalysis' }],
    },
  ],
  'pt2': [
    {
      id: 'h5', date: '2026-02-28', type: 'Consultation', professional: 'Dr. James Park', status: 'completed',
      notes: 'Cardiology review. Lipid panel ordered.',
      prescriptions: [{ medication: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily' }],
      labRecords: [{ name: 'Lipid Panel', type: 'Blood Work' }],
    },
    {
      id: 'h6', date: '2025-12-15', type: 'Follow-up', professional: 'Dr. James Park', status: 'completed',
      notes: 'Post-procedure follow-up. Healing well.',
      prescriptions: [],
      labRecords: [{ name: 'ECG Tracing', type: 'Cardiology' }],
    },
  ],
  'pt3': [
    {
      id: 'h7', date: '2026-03-01', type: 'Lab Review', professional: 'Dr. Liu Wei', status: 'completed',
      notes: 'Diabetes management. A1C slightly elevated. Diet counseled.',
      prescriptions: [
        { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
        { medication: 'Glipizide', dosage: '5mg', frequency: 'Once daily' },
      ],
      labRecords: [{ name: 'Blood Sugar Fasting', type: 'Blood Work' }],
    },
    {
      id: 'h8', date: '2026-01-18', type: 'Consultation', professional: 'Dr. Liu Wei', status: 'completed',
      notes: 'General wellness visit.',
      prescriptions: [],
      labRecords: [],
    },
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

// ── Lab record new-tab viewer ─────────────────────────────────────────────────

function openLabRecordInNewTab(record: { name: string; type: string }) {
  const mock = MOCK_PREVIEW_CONTENT[record.type]
  const win = window.open('', '_blank')
  if (!win) return

  const tableRows = mock
    ? mock.rows.map(([test, value, range]) =>
        `<tr><td>${test}</td><td><strong>${value}</strong></td><td class="ref">${range}</td></tr>`
      ).join('')
    : `<tr><td colspan="3" class="empty">No structured data available — download to view.</td></tr>`

  win.document.write(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<title>${record.name}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 48px auto; padding: 0 24px; color: #111; }
  h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 4px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #f1f5f9; font-size: 0.75rem; color: #475569; margin-bottom: 28px; }
  .section-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  thead th { text-align: left; padding: 8px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-weight: 600; font-size: 0.75rem; color: #475569; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  .ref { color: #64748b; }
  .empty { color: #94a3b8; padding: 24px 12px; text-align: center; }
</style>
</head><body>
<h1>${record.name}</h1>
<span class="badge">${record.type}</span>
${mock ? `<p class="section-label">${mock.label}</p>` : ''}
<table>
  <thead><tr><th>Test</th><th>Result</th><th>Reference Range</th></tr></thead>
  <tbody>${tableRows}</tbody>
</table>
</body></html>`)
  win.document.close()
}

// ── Tab: Patient History ──────────────────────────────────────────────────────

function PatientHistoryTab({ patientId }: { patientId: string }) {
  const history = (MOCK_HISTORY[patientId] ?? []).slice(0, 5)

  // All cards expanded by default; prescriptions and lab records sub-collapsed
  const [collapsedIds,     setCollapsedIds]     = useState<Set<string>>(new Set())
  const [rxExpandedIds,    setRxExpandedIds]    = useState<Set<string>>(new Set())
  const [labExpandedIds,   setLabExpandedIds]   = useState<Set<string>>(new Set())

  const toggleCard   = (id: string) => setCollapsedIds(prev  => { const n = new Set(prev);  n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleRx     = (id: string) => setRxExpandedIds(prev => { const n = new Set(prev);  n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleLab    = (id: string) => setLabExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No previous visits on record.</p>
  }

  return (
    <div className="space-y-3">
      {history.map(v => {
        const collapsed   = collapsedIds.has(v.id)
        const rxExpanded  = rxExpandedIds.has(v.id)
        const labExpanded = labExpandedIds.has(v.id)
        return (
          <div key={v.id} className="border rounded-md overflow-hidden">
            {/* Visit header — click to collapse/expand */}
            <button
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggleCard(v.id)}
              aria-expanded={!collapsed}
            >
              <div className="flex items-center gap-3 min-w-0">
                {collapsed
                  ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-sm font-medium">{v.date} — {v.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.professional}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs capitalize shrink-0">{v.status}</Badge>
            </button>

            {/* Body — visible unless collapsed */}
            {!collapsed && (
              <div className="divide-y">
                {/* Clinical Notes — always visible */}
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Clinical Notes</p>
                  <p className="text-sm">{v.notes}</p>
                </div>

                {/* Prescriptions — sub-collapsible (collapsed by default) */}
                {v.prescriptions.length > 0 && (
                  <div>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => toggleRx(v.id)}
                    >
                      {rxExpanded
                        ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      }
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Prescriptions <span className="normal-case font-normal">({v.prescriptions.length})</span>
                      </p>
                    </button>
                    {rxExpanded && (
                      <div className="px-4 pb-3 space-y-1">
                        {v.prescriptions.map((rx, i) => (
                          <div key={i} className="flex items-baseline gap-2 text-sm">
                            <span className="font-medium">{rx.medication} {rx.dosage}</span>
                            <span className="text-xs text-muted-foreground">· {rx.frequency}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Lab Records — sub-collapsible (collapsed by default) */}
                {v.labRecords.length > 0 && (
                  <div>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => toggleLab(v.id)}
                    >
                      {labExpanded
                        ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      }
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Lab Records <span className="normal-case font-normal">({v.labRecords.length})</span>
                      </p>
                    </button>
                    {labExpanded && (
                      <div className="px-4 pb-3 space-y-1">
                        {v.labRecords.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => openLabRecordInNewTab(r)}
                            className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-left"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>{r.name}</span>
                            <span className="text-xs text-muted-foreground">· {r.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Mock historical invoices ──────────────────────────────────────────────────

const MOCK_INVOICES: Record<string, { id: string; date: string; description: string; amount: number; status: 'paid' | 'waived' | 'draft' | 'overdue' }[]> = {
  'pt1': [
    { id: 'inv-001', date: '2026-02-15', description: 'Consultation — Dr. Sarah Kim',   amount: 1500, status: 'paid'    },
    { id: 'inv-002', date: '2026-01-10', description: 'Follow-up Visit — Dr. Sarah Kim', amount: 800,  status: 'waived'  },
    { id: 'inv-003', date: '2025-11-20', description: 'Lab Review — Dr. James Park',     amount: 2200, status: 'paid'    },
  ],
  'pt2': [
    { id: 'inv-004', date: '2026-02-28', description: 'Cardiology Consultation — Dr. James Park', amount: 3500, status: 'paid'    },
    { id: 'inv-005', date: '2025-12-15', description: 'Follow-up — Dr. James Park',               amount: 1200, status: 'overdue' },
  ],
  'pt3': [
    { id: 'inv-006', date: '2026-03-01', description: 'Diabetes Management — Dr. Liu Wei', amount: 1800, status: 'draft' },
  ],
}

const INVOICE_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default', waived: 'secondary', draft: 'outline', overdue: 'destructive',
}

// ── Tab: Billing (historical) ─────────────────────────────────────────────────

function BillingTab({ patientId }: { patientId: string }) {
  const invoices = MOCK_INVOICES[patientId] ?? []
  const total = invoices.reduce((sum, i) => sum + (i.status !== 'waived' ? i.amount : 0), 0)

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No billing history for this patient.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Past invoices for this patient across all visits.</p>
      <div className="space-y-2">
        {invoices.map(inv => (
          <div key={inv.id} className="flex items-center justify-between gap-3 rounded-md border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{inv.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{inv.date} · {inv.id}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <p className="text-sm font-semibold">
                {inv.status === 'waived' ? <span className="line-through text-muted-foreground">₱{inv.amount.toLocaleString()}</span> : `₱${inv.amount.toLocaleString()}`}
              </p>
              <Badge variant={INVOICE_BADGE[inv.status]} className="text-xs capitalize">{inv.status}</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t pt-3">
        <p className="text-sm text-muted-foreground">Total paid: <span className="font-semibold text-foreground">₱{total.toLocaleString()}</span></p>
      </div>
    </div>
  )
}

// ── In-visit Billing Section (on Visit tab) ───────────────────────────────────

function VisitBillingSection({
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
      <div className="py-6 text-center space-y-2">
        <p className="text-base font-semibold text-green-600">
          {waivedFee ? 'Fee Waived — Invoice Created' : 'Draft Invoice Created'}
        </p>
        <p className="text-sm text-muted-foreground">Invoice {invoiceCreated} saved as a draft for {patientName}.</p>
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
                  <Input value={i.description} onChange={e => updateItem(i.id, 'description', e.target.value)} placeholder="Description" className="h-8 text-sm" aria-label="Item description" />
                  <Input type="number" min={1} value={i.qty} onChange={e => updateItem(i.id, 'qty', Number(e.target.value))} className="h-8 text-sm text-right" aria-label="Quantity" />
                  <Input type="number" min={0} value={i.unitPrice} onChange={e => updateItem(i.id, 'unitPrice', Number(e.target.value))} className="h-8 text-sm text-right" aria-label="Unit price" />
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
        <p className="text-xs text-destructive">All line items have ₱0 — add prices before creating invoice.</p>
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

// ── Referral Section ──────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Neurology', 'Oncology', 'Orthopedics', 'Pulmonology', 'Rheumatology', 'Urology',
]

const REFERRAL_DOCTORS: Record<string, { id: string; name: string; clinic: string; available: boolean }[]> = {
  'Cardiology':       [{ id: 'rd1', name: 'Dr. Ana Reyes',      clinic: 'Heart Care Center',      available: true  }, { id: 'rd2', name: 'Dr. Marco Santos',  clinic: 'Metro Cardiac Clinic',   available: false }],
  'Dermatology':      [{ id: 'rd3', name: 'Dr. Liza Tan',        clinic: 'Skin & Wellness Clinic',  available: true  }],
  'Endocrinology':    [{ id: 'rd4', name: 'Dr. Felix Cruz',      clinic: 'Endocrine Health Clinic', available: true  }, { id: 'rd5', name: 'Dr. Nina Valdez',   clinic: 'Metro Diabetes Center',  available: true  }],
  'Gastroenterology': [{ id: 'rd6', name: 'Dr. Jose Aquino',     clinic: 'GI Care Associates',      available: false }],
  'Neurology':        [{ id: 'rd7', name: 'Dr. Maya Dela Cruz',  clinic: 'NeuroMed Clinic',         available: true  }, { id: 'rd8', name: 'Dr. Ryan Bautista', clinic: 'Brain & Spine Center',   available: true  }],
  'Oncology':         [{ id: 'rd9', name: 'Dr. Carla Mendez',   clinic: 'Cancer Care Institute',   available: true  }],
  'Orthopedics':      [{ id: 'rd10', name: 'Dr. Ben Torres',     clinic: 'Bone & Joint Clinic',     available: true  }],
  'Pulmonology':      [{ id: 'rd11', name: 'Dr. Grace Lim',      clinic: 'Lung Health Center',      available: false }],
  'Rheumatology':     [{ id: 'rd12', name: 'Dr. Samuel Ong',     clinic: 'Arthritis & Rheum Clinic',available: true  }],
  'Urology':          [{ id: 'rd13', name: 'Dr. Dario Flores',   clinic: 'UroCare Clinic',          available: true  }],
}

const NOTIFY_ROLES = ['Org Admin', 'Receptionist', 'Medical Secretary', 'Attending Physicians']

function ReferralSection() {
  const [enabled,          setEnabled]          = useState(false)
  const [specialization,   setSpecialization]   = useState('')
  const [selectedDoctor,   setSelectedDoctor]   = useState('')
  const [reason,           setReason]           = useState('')
  const [sent,             setSent]             = useState(false)

  const doctors = specialization ? (REFERRAL_DOCTORS[specialization] ?? []) : []

  const handleSend = () => {
    if (!specialization || !selectedDoctor) return
    setSent(true)
  }

  const handleReset = () => {
    setSent(false); setSpecialization(''); setSelectedDoctor(''); setReason('')
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="refer-toggle"
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={enabled}
          onChange={e => { setEnabled(e.target.checked); if (!e.target.checked) handleReset() }}
        />
        <label htmlFor="refer-toggle" className="text-sm font-medium cursor-pointer select-none">
          Refer to a Physician
        </label>
      </div>

      {enabled && !sent && (
        <div className="space-y-4 pt-1">
          {/* Specialization picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Specialization *</Label>
            <select
              className="border rounded-md px-2 py-1.5 text-sm bg-background w-full"
              value={specialization}
              onChange={e => { setSpecialization(e.target.value); setSelectedDoctor('') }}
              aria-label="Select specialization"
            >
              <option value="">Select a specialization…</option>
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Available doctors */}
          {specialization && (
            <div className="space-y-1.5">
              <Label className="text-xs">Available Doctors *</Label>
              {doctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No doctors found for this specialization.</p>
              ) : (
                <div className="space-y-2">
                  {doctors.map(d => (
                    <label
                      key={d.id}
                      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${
                        selectedDoctor === d.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                      } ${!d.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="referral-doctor"
                          value={d.id}
                          checked={selectedDoctor === d.id}
                          disabled={!d.available}
                          onChange={() => setSelectedDoctor(d.id)}
                          className="accent-primary shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{d.clinic}</p>
                        </div>
                      </div>
                      <Badge variant={d.available ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {d.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason (optional) */}
          {specialization && selectedDoctor && (
            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Referral (optional)</Label>
              <textarea
                className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe the clinical reason for this referral…"
                aria-label="Reason for referral"
              />
            </div>
          )}

          {/* Notify info + Send */}
          {specialization && selectedDoctor && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  A notification will be sent to:{' '}
                  <span className="font-medium text-foreground">{NOTIFY_ROLES.join(', ')}</span>
                </p>
              </div>
              <Button size="sm" onClick={handleSend} className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Send Referral
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sent confirmation */}
      {sent && (
        <div className="space-y-2 pt-1">
          <p className="text-sm font-medium text-green-700">Referral sent ✓</p>
          <p className="text-xs text-muted-foreground">
            Referred to <strong>{doctors.find(d => d.id === selectedDoctor)?.name}</strong> ({specialization}).
            Notifications sent to: {NOTIFY_ROLES.join(', ')}.
          </p>
          <Button size="sm" variant="outline" onClick={handleReset}>Send Another Referral</Button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type VisitTab = 'visit' | 'history' | 'billing'

const VISIT_TABS: { key: VisitTab; label: string }[] = [
  { key: 'visit',   label: 'Visit'          },
  { key: 'history', label: 'Patient History' },
  { key: 'billing', label: 'Billing'         },
]

export function AppointmentVisitPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()

  const appt = appointmentId ? MOCK_VISIT_APPOINTMENTS[appointmentId] : undefined
  const patient = appt ? MOCK_PATIENTS.find(p => p.id === appt.patientId) : undefined

  // ── Per-visit state (lifted so it survives tab switches) ──
  const [activeTab,     setActiveTab]     = useState<VisitTab>('visit')
  const [followUpDate,  setFollowUpDate]  = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [lineItems,     setLineItems]     = useState<LineItem[]>([])
  const [waivedFee,     setWaivedFee]     = useState(false)
  const [labRecords,    setLabRecords]    = useState<LabRecord[]>([])

  // ── Visit section collapsed state (clinical notes open by default) ──
  const [secCollapsed, setSecCollapsed] = useState({
    clinical: false, prescriptions: true, lab: true, billing: true, internal: true, referral: true,
  })
  const toggleSec = (key: keyof typeof secCollapsed) =>
    setSecCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  // ── Cancel / save / auto-save UI state ──
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelled,         setCancelled]         = useState(false)
  const [autoSaveLabel,     setAutoSaveLabel]     = useState('')
  const [saved,             setSaved]             = useState(false)

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
  }

  const handleCancelAppointment = () => {
    setCancelled(true)
    setShowCancelConfirm(false)
    setTimeout(() => navigate('/appointments'), 1500)
  }

  const handleSaveVisit = () => {
    setSaved(true)
    setAutoSaveLabel('Saved')
    setTimeout(() => { setSaved(false); setAutoSaveLabel('') }, 2000)
  }

  return (
    <div className="space-y-6">
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
          <div className="flex items-center gap-2 shrink-0">
            {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
            <Button size="sm" variant="outline" onClick={() => navigate('/appointments')}>Cancel</Button>
            <Button size="sm" onClick={handleSaveVisit}>Save Visit</Button>
          </div>
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
          {activeTab === 'visit' && (
            <div className="divide-y">
              {/* Clinical Notes */}
              <section className="py-1">
                <button
                  className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSec('clinical')}
                >
                  {secCollapsed.clinical
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinical Notes</h3>
                </button>
                {!secCollapsed.clinical && (
                  <div className="pb-4">
                    <ClinicalNotesTab appointmentId={appt.id} notes={clinicalNotes} onChange={setClinicalNotes} />
                  </div>
                )}
              </section>

              {/* Prescriptions */}
              <section className="py-1">
                <button
                  className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSec('prescriptions')}
                >
                  {secCollapsed.prescriptions
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Prescriptions
                    {prescriptions.length > 0 && <span className="ml-1 normal-case font-normal">({prescriptions.length})</span>}
                  </h3>
                </button>
                {!secCollapsed.prescriptions && (
                  <div className="pb-4">
                    <PrescriptionTab patientName={appt.patientName} prescriptions={prescriptions} onChange={setPrescriptions} />
                  </div>
                )}
              </section>

              {/* Lab Records */}
              <section className="py-1">
                <button
                  className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSec('lab')}
                >
                  {secCollapsed.lab
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lab Records
                    {labRecords.length > 0 && <span className="ml-1 normal-case font-normal">({labRecords.length})</span>}
                  </h3>
                </button>
                {!secCollapsed.lab && (
                  <div className="pb-4">
                    <LabRecordsTab records={labRecords} onRecordsChange={setLabRecords} />
                  </div>
                )}
              </section>

              {/* Billing */}
              <section className="py-1">
                <button
                  className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSec('billing')}
                >
                  {secCollapsed.billing
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing</h3>
                </button>
                {!secCollapsed.billing && (
                  <div className="pb-4">
                    <VisitBillingSection
                      appointmentId={appt.id}
                      patientName={appt.patientName}
                      items={lineItems}
                      onItemsChange={setLineItems}
                      waivedFee={waivedFee}
                      onWaivedFeeChange={setWaivedFee}
                    />
                  </div>
                )}
              </section>

              {/* Internal Notes */}
              <section className="py-1">
                <button
                  className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSec('internal')}
                >
                  {secCollapsed.internal
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Internal Notes <span className="normal-case font-normal">(staff only)</span>
                  </h3>
                </button>
                {!secCollapsed.internal && (
                  <div className="pb-4">
                    <InternalNotesTab appointmentId={appt.id} notes={internalNotes} onChange={setInternalNotes} />
                  </div>
                )}
              </section>

              {/* Physician Referral */}
              <section className="py-1">
                <button
                  className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSec('referral')}
                >
                  {secCollapsed.referral
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Physician Referral</h3>
                </button>
                {!secCollapsed.referral && (
                  <div className="pb-4">
                    <ReferralSection />
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'history' && (
            <PatientHistoryTab patientId={appt.patientId} />
          )}

          {activeTab === 'billing' && (
            <BillingTab patientId={appt.patientId} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
