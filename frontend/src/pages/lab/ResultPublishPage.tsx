import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Stub mock patients — replace at CC-49
const MOCK_PATIENTS = [
  { id: 'p1', name: 'John Doe' },
  { id: 'p2', name: 'Jane Smith' },
  { id: 'p3', name: 'Carlos Rivera' },
  { id: 'p4', name: 'Priya Patel' },
  { id: 'p5', name: 'Emily Chen' },
]

export function ResultPublishPage() {
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [testName, setTestName] = useState('')
  const [notes, setNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const filteredPatients = MOCK_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()),
  )

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === selectedPatientId)

  const handlePublishClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmPublish = () => {
    setShowConfirm(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="space-y-6 max-w-xl">
        <h1 className="text-2xl font-bold text-foreground">Publish Lab Result</h1>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-green-600 font-medium">
              Result published to patient portal
            </p>
            <Button asChild variant="outline">
              <Link to="/lab">Back to Lab Records</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-foreground">Publish Lab Result</h1>

      <Card>
        <CardHeader>
          <CardTitle>Result Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient selector */}
          <div className="space-y-1 relative">
            <Label htmlFor="patient-search">Patient</Label>
            <Input
              id="patient-search"
              value={selectedPatient ? selectedPatient.name : patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                setSelectedPatientId('')
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search patient..."
              autoComplete="off"
            />
            {showDropdown && patientSearch && !selectedPatientId && (
              <div className="absolute z-10 w-full bg-card border rounded-md shadow-md mt-1">
                {filteredPatients.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No patients found</p>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                      onClick={() => {
                        setSelectedPatientId(p.id)
                        setPatientSearch(p.name)
                        setShowDropdown(false)
                      }}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* File picker */}
          <div className="space-y-1">
            <Label>File</Label>
            <label
              htmlFor="result-file"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40"
            >
              <p className="text-sm text-muted-foreground">Click to select file</p>
              <input
                id="result-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && <p className="text-sm">Selected: <span className="font-medium">{file.name}</span></p>}
          </div>

          {/* Test name */}
          <div className="space-y-1">
            <Label htmlFor="test-name">Test Name</Label>
            <Input
              id="test-name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Complete Blood Count"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the patient..."
            />
          </div>

          {/* Confirmation */}
          {showConfirm ? (
            <div className="rounded-md bg-muted/40 border p-3 space-y-2">
              <p className="text-sm font-medium text-foreground">
                This result will be immediately visible to the patient.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleConfirmPublish}>Confirm Publish</Button>
                <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handlePublishClick}
              disabled={!selectedPatientId || !file || !testName.trim()}
            >
              Publish
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
