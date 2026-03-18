import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

type Tab = 'Overview' | 'Appointments' | 'Prescriptions' | 'Lab Results' | 'Uploaded Records'

const TABS: Tab[] = ['Overview', 'Appointments', 'Prescriptions', 'Lab Results', 'Uploaded Records']

// Stub mock patient data — replace at real API integration
const MOCK_PATIENTS: Record<string, { name: string; dob: string; gender: string; bloodType: string; allergies: string[] }> = {
  default: { name: 'John Doe', dob: '1980-05-12', gender: 'Male', bloodType: 'O+', allergies: ['Penicillin', 'Aspirin'] },
  p1: { name: 'Jane Smith', dob: '1975-09-23', gender: 'Female', bloodType: 'A-', allergies: ['Sulfa drugs'] },
}

// All historical appointments for this patient — across multiple professionals
const MOCK_APPOINTMENTS = [
  { id: 'a1', date: '2026-03-18', time: '08:30', professional: 'Dr. Sarah Kim',  role: 'Doctor', type: 'Follow-up',    status: 'Booked',     notes: 'Reviewing medication response.' },
  { id: 'a2', date: '2026-03-10', time: '10:00', professional: 'Dr. Sarah Kim',  role: 'Doctor', type: 'Consultation', status: 'Completed',  notes: 'Patient presented with mild fever. Prescribed rest and fluids.' },
  { id: 'a3', date: '2026-02-15', time: '09:30', professional: 'Dr. James Park', role: 'Doctor', type: 'Follow-up',    status: 'Completed',  notes: 'Recovery progressing well. No further medication needed.' },
  { id: 'a4', date: '2026-01-22', time: '11:00', professional: 'Nurse Ana Santos', role: 'Nurse', type: 'Lab Review',  status: 'Completed',  notes: 'CBC results reviewed. Values within normal range.' },
  { id: 'a5', date: '2025-12-05', time: '14:00', professional: 'Dr. Liu Wei',    role: 'Doctor', type: 'New Patient', status: 'Completed',  notes: 'Initial intake. Allergies noted: Penicillin, Aspirin.' },
]

const APPT_STATUS_COLOR: Record<string, string> = {
  Booked:    'bg-blue-100 text-blue-800',
  Completed: 'bg-gray-100 text-gray-700',
  Cancelled: 'bg-red-100 text-red-700',
  'No Show': 'bg-yellow-100 text-yellow-800',
}

const MOCK_PRESCRIPTIONS = [
  { id: 'rx1', medication: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', status: 'Active' as const },
  { id: 'rx2', medication: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', status: 'Completed' as const },
]

const MOCK_LAB_RESULTS = [
  { id: 'lr1', testName: 'Complete Blood Count', date: '2026-03-10', result: 'Normal range', status: 'Available' as const },
  { id: 'lr2', testName: 'HbA1c', date: '2026-03-18', result: 'Pending', status: 'Pending' as const },
]

const MOCK_UPLOADS = [
  { id: 'u1', filename: 'referral_letter.pdf', category: 'Referral Letter', uploadDate: '2026-03-17' },
  { id: 'u2', filename: 'old_prescription.jpg', category: 'Prescription', uploadDate: '2026-03-18' },
]

const DOCUMENT_CATEGORIES = ['Lab Result', 'Prescription', 'Referral Letter', 'Other']
const MOCK_VISIT_LIST = ['Visit 2026-03-10 — Consultation', 'Visit 2026-02-15 — Follow-up']

export function PatientChartPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const patient = MOCK_PATIENTS[patientId ?? 'default'] ?? MOCK_PATIENTS.default
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null)
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [verifyCategory, setVerifyCategory] = useState('')
  const [verifyClinicalNotes, setVerifyClinicalNotes] = useState('')
  const [verifyVisit, setVerifyVisit] = useState('')

  // Prescriptions tab state (CC-59 will enhance)
  const [prescriptions, setPrescriptions] = useState(MOCK_PRESCRIPTIONS)
  const [showNewRx, setShowNewRx] = useState(false)
  const [rxMed, setRxMed] = useState('')
  const [rxDosage, setRxDosage] = useState('')
  const [rxFreq, setRxFreq] = useState('Once daily')
  const [rxDuration, setRxDuration] = useState('')
  const [rxNotes, setRxNotes] = useState('')

  const handleSaveRx = () => {
    if (!rxMed.trim() || !rxDosage.trim() || !rxDuration.trim()) return
    setPrescriptions((prev) => [
      ...prev,
      { id: `rx-${Date.now()}`, medication: rxMed, dosage: rxDosage, frequency: rxFreq, status: 'Active' as const },
    ])
    setShowNewRx(false)
    setRxMed(''); setRxDosage(''); setRxFreq('Once daily'); setRxDuration(''); setRxNotes('')
  }

  const handleMarkComplete = (id: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) => rx.id === id ? { ...rx, status: 'Completed' as const } : rx),
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Patient Chart — {patient.name}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Name</p><p className="font-medium">{patient.name}</p></div>
              <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium">{patient.dob}</p></div>
              <div><p className="text-muted-foreground">Gender</p><p className="font-medium">{patient.gender}</p></div>
              <div><p className="text-muted-foreground">Blood Type</p><p className="font-medium">{patient.bloodType}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Allergies</CardTitle></CardHeader>
            <CardContent>
              {patient.allergies.length === 0 ? (
                <p className="text-sm text-muted-foreground">None recorded</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {patient.allergies.map((a) => (
                    <Badge key={a} variant="destructive">{a}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Active Prescriptions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{prescriptions.filter((r) => r.status === 'Active').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Appointments</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{MOCK_APPOINTMENTS.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  across {new Set(MOCK_APPOINTMENTS.map(a => a.professional)).size} professionals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Appointments tab — full history across all professionals */}
      {activeTab === 'Appointments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Appointment History</h2>
            <Badge variant="secondary">{MOCK_APPOINTMENTS.length} records</Badge>
          </div>
          {MOCK_APPOINTMENTS.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedApptId(expandedApptId === appt.id ? null : appt.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[3.5rem]">
                      <p className="text-xs text-muted-foreground">{appt.date.slice(0, 7)}</p>
                      <p className="text-sm font-semibold">{appt.date.slice(8)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{appt.time}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{appt.type}</p>
                      <p className="text-sm text-muted-foreground">{appt.professional}</p>
                      <p className="text-xs text-muted-foreground">{appt.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPT_STATUS_COLOR[appt.status] ?? ''}`}>
                      {appt.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{expandedApptId === appt.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedApptId === appt.id && appt.notes && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Clinical Notes</p>
                    <p className="text-sm text-foreground">{appt.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Prescriptions tab */}
      {activeTab === 'Prescriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prescriptions</h2>
            <Button size="sm" onClick={() => setShowNewRx(true)}>New Prescription</Button>
          </div>
          {showNewRx && (
            <Card>
              <CardHeader><CardTitle>New Prescription</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="rx-med">Medication</Label>
                    <input id="rx-med" className="border rounded-md px-3 py-1.5 text-sm bg-background w-full" value={rxMed} onChange={(e) => setRxMed(e.target.value)} placeholder="e.g. Amoxicillin" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rx-dosage">Dosage</Label>
                    <input id="rx-dosage" className="border rounded-md px-3 py-1.5 text-sm bg-background w-full" value={rxDosage} onChange={(e) => setRxDosage(e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rx-freq">Frequency</Label>
                    <select id="rx-freq" className="border rounded-md px-3 py-2 text-sm bg-background w-full" value={rxFreq} onChange={(e) => setRxFreq(e.target.value)}>
                      {['Once daily', 'Twice daily', 'Three times daily', 'As needed'].map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rx-duration">Duration</Label>
                    <input id="rx-duration" className="border rounded-md px-3 py-1.5 text-sm bg-background w-full" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} placeholder="e.g. 7 days" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rx-notes">Notes (optional)</Label>
                  <textarea id="rx-notes" className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none" rows={2} value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveRx}>Save Prescription</Button>
                  <Button variant="outline" onClick={() => setShowNewRx(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {prescriptions.filter((rx) => rx.status === 'Active').map((rx) => (
              <Card key={rx.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{rx.medication} {rx.dosage}</p>
                    <p className="text-xs text-muted-foreground">{rx.frequency}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge>Active</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleMarkComplete(rx.id)}>Mark Complete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {prescriptions.filter((rx) => rx.status === 'Completed').length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mt-4 mb-2">History</p>
                {prescriptions.filter((rx) => rx.status === 'Completed').map((rx) => (
                  <Card key={rx.id} className="opacity-60">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{rx.medication} {rx.dosage}</p>
                        <p className="text-xs text-muted-foreground">{rx.frequency}</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lab Results tab */}
      {activeTab === 'Lab Results' && (
        <div className="space-y-3">
          {MOCK_LAB_RESULTS.map((lr) => (
            <Card key={lr.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{lr.testName}</p>
                  <p className="text-xs text-muted-foreground">{lr.date} — {lr.result}</p>
                </div>
                <Badge variant={lr.status === 'Available' ? 'default' : 'secondary'}>{lr.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Records tab */}
      {activeTab === 'Uploaded Records' && (
        <div className="space-y-3">
          {MOCK_UPLOADS.map((upload) => (
            <Card key={upload.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {upload.filename.endsWith('.pdf') ? 'PDF' : 'IMG'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{upload.filename}</p>
                      <Badge variant="secondary" className="text-xs">{upload.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">Pending</Badge>
                    <Button size="sm" onClick={() => { setVerifyId(upload.id); setVerifyCategory(upload.category); setVerifyVisit(''); setVerifyClinicalNotes('') }}>
                      Verify
                    </Button>
                  </div>
                </div>

                {/* Inline verify form */}
                {verifyId === upload.id && (
                  <div className="border-t pt-3 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="verify-cat">Category</Label>
                      <select
                        id="verify-cat"
                        className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                        value={verifyCategory}
                        onChange={(e) => setVerifyCategory(e.target.value)}
                      >
                        {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="verify-notes">Clinical Notes</Label>
                      <textarea
                        id="verify-notes"
                        className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
                        rows={2}
                        value={verifyClinicalNotes}
                        onChange={(e) => setVerifyClinicalNotes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="verify-visit">Link to Visit (optional)</Label>
                      <select
                        id="verify-visit"
                        className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                        value={verifyVisit}
                        onChange={(e) => setVerifyVisit(e.target.value)}
                      >
                        <option value="">None</option>
                        {MOCK_VISIT_LIST.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setVerifyId(null)}>Verify</Button>
                      <Button size="sm" variant="destructive" onClick={() => setVerifyId(null)}>Reject with reason</Button>
                      <Button size="sm" variant="outline" onClick={() => setVerifyId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
