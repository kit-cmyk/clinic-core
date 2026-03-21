import { useState, useEffect } from 'react'
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
import type { Patient } from '@/types'

// ── Shared mock data ───────────────────────────────────────────────────────────

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pt1', tenantId: 't1', firstName: 'John', lastName: 'Doe', fullName: 'John Doe',
    dob: '1985-03-12', gender: 'Male', phone: '09171234567', email: 'john.doe@email.com',
    address: '12 Rizal St, Quezon City', bloodType: 'O+',
    allergies: [], medicalHistory: 'Hypertension (2019). Managed with Amlodipine.',
    knownConditions: 'Hypertension', previousPrescriptions: 'Amlodipine 5mg once daily',
    isActive: true,
  },
  {
    id: 'pt2', tenantId: 't1', firstName: 'Maria', lastName: 'Chen', fullName: 'Maria Chen',
    dob: '1990-07-22', gender: 'Female', phone: '09181234567', email: 'maria.chen@email.com',
    address: '45 Mabini Ave, Makati', bloodType: 'A-',
    allergies: ['Penicillin'], medicalHistory: 'Allergic rhinitis. No hospitalizations.',
    knownConditions: 'Allergic rhinitis', previousPrescriptions: 'Cetirizine 10mg as needed',
    isActive: true,
  },
  {
    id: 'pt3', tenantId: 't1', firstName: 'Carlos', lastName: 'Rivera', fullName: 'Carlos Rivera',
    dob: '1978-11-05', gender: 'Male', phone: '09191234567', email: 'carlos.rivera@email.com',
    address: '8 Luna Rd, Pasig', bloodType: 'B+',
    allergies: [], medicalHistory: 'Type 2 Diabetes (2015). Diet-controlled.',
    knownConditions: 'Type 2 Diabetes Mellitus', previousPrescriptions: 'Metformin 500mg twice daily',
    isActive: true,
  },
  {
    id: 'pt4', tenantId: 't1', firstName: 'Priya', lastName: 'Sharma', fullName: 'Priya Sharma',
    dob: '1995-02-18', gender: 'Female', phone: '09201234567', email: 'priya.sharma@email.com',
    address: '22 Aguinaldo Blvd, Taguig', bloodType: 'AB+',
    allergies: ['Aspirin'], medicalHistory: 'No significant medical history.',
    knownConditions: 'None', previousPrescriptions: 'None',
    isActive: true,
  },
  {
    id: 'pt5', tenantId: 't1', firstName: 'Tom', lastName: 'Wilson', fullName: 'Tom Wilson',
    dob: '1982-09-30', gender: 'Male', phone: '09211234567', email: 'tom.wilson@email.com',
    address: '5 Del Pilar St, Mandaluyong', bloodType: 'O-',
    allergies: [], medicalHistory: 'Appendectomy (2010). No current conditions.',
    knownConditions: 'None', previousPrescriptions: 'None',
    isActive: true,
  },
  {
    id: 'pt6', tenantId: 't1', firstName: 'Sara', lastName: 'Ahmed', fullName: 'Sara Ahmed',
    dob: '1992-04-14', gender: 'Female', phone: '09221234567', email: 'sara.ahmed@email.com',
    address: '31 Bonifacio St, Caloocan', bloodType: 'A+',
    allergies: [], medicalHistory: 'Asthma (childhood, resolved).',
    knownConditions: 'None active', previousPrescriptions: 'Salbutamol inhaler (PRN)',
    isActive: true,
  },
  {
    id: 'pt7', tenantId: 't1', firstName: 'James', lastName: 'Liu', fullName: 'James Liu',
    dob: '1975-12-01', gender: 'Male', phone: '09231234567', email: 'james.liu@email.com',
    address: '18 Burgos Ave, Las Piñas', bloodType: 'B-',
    allergies: ['Sulfa'], medicalHistory: 'GERD. Managed with lifestyle changes.',
    knownConditions: 'Gastroesophageal Reflux Disease', previousPrescriptions: 'Omeprazole 20mg once daily',
    isActive: false,
  },
  {
    id: 'pt8', tenantId: 't1', firstName: 'Anna', lastName: 'Kowalski', fullName: 'Anna Kowalski',
    dob: '1988-06-25', gender: 'Female', phone: '09241234567', email: 'anna.kowalski@email.com',
    address: '7 Jacinto Blvd, Paranaque', bloodType: 'O+',
    allergies: [], medicalHistory: 'Migraine (chronic). Managed with preventive therapy.',
    knownConditions: 'Chronic migraine', previousPrescriptions: 'Topiramate 25mg once daily',
    isActive: true,
  },
  {
    id: 'pt9', tenantId: 't1', firstName: 'Aisha', lastName: 'Patel', fullName: 'Aisha Patel',
    dob: '1998-08-09', gender: 'Female', phone: '09251234567', email: 'aisha.patel@email.com',
    address: '14 Roxas Blvd, Pasay', bloodType: 'AB-',
    allergies: [], medicalHistory: 'No significant medical history.',
    knownConditions: 'None', previousPrescriptions: 'None',
    isActive: true,
  },
]

// ── Types ──────────────────────────────────────────────────────────────────────

type PatientFormValues = {
  firstName: string
  lastName: string
  dob: string
  gender: string
  phone: string
  email: string
  address: string
  bloodType: string
  allergies: string       // comma-separated display
  medicalHistory: string
  knownConditions: string
  previousPrescriptions: string
}

type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>

interface PatientFormProps {
  open: boolean
  onClose: () => void
  onSave: (patient: Patient) => void
  initialValues?: Partial<Patient>
}

const EMPTY: PatientFormValues = {
  firstName: '', lastName: '', dob: '', gender: 'Male', phone: '', email: '',
  address: '', bloodType: '', allergies: '', medicalHistory: '',
  knownConditions: '', previousPrescriptions: '',
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function toValues(p?: Partial<Patient>): PatientFormValues {
  if (!p) return EMPTY
  return {
    firstName:             p.firstName             ?? '',
    lastName:              p.lastName              ?? '',
    dob:                   p.dob                   ?? '',
    gender:                p.gender                ?? 'Male',
    phone:                 p.phone                 ?? '',
    email:                 p.email                 ?? '',
    address:               p.address               ?? '',
    bloodType:             p.bloodType             ?? '',
    allergies:             (p.allergies ?? []).join(', '),
    medicalHistory:        p.medicalHistory        ?? '',
    knownConditions:       p.knownConditions       ?? '',
    previousPrescriptions: p.previousPrescriptions ?? '',
  }
}

function validate(v: PatientFormValues): PatientFormErrors {
  const e: PatientFormErrors = {}
  if (!v.firstName.trim()) e.firstName = 'Required'
  if (!v.lastName.trim())  e.lastName  = 'Required'
  if (!v.gender.trim())    e.gender    = 'Required'
  if (!v.phone.trim())     e.phone     = 'Required'
  if (!v.address.trim())   e.address   = 'Required'
  return e
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PatientForm({ open, onClose, onSave, initialValues }: PatientFormProps) {
  const isEdit = !!initialValues?.id
  const [form,   setForm]   = useState<PatientFormValues>(() => toValues(initialValues))
  const [errors, setErrors] = useState<PatientFormErrors>({})

  useEffect(() => {
    if (open) {
      setForm(toValues(initialValues))
      setErrors({})
    }
  }, [open, initialValues])

  const set = (field: keyof PatientFormValues, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const patient: Patient = {
      id:                    initialValues?.id      ?? `pt-${Date.now()}`,
      tenantId:              initialValues?.tenantId ?? 't1',
      firstName:             form.firstName.trim(),
      lastName:              form.lastName.trim(),
      fullName:              `${form.firstName.trim()} ${form.lastName.trim()}`,
      dob:                   form.dob               || undefined,
      gender:                form.gender,
      phone:                 form.phone.trim(),
      email:                 form.email.trim()      || undefined,
      address:               form.address.trim()    || undefined,
      bloodType:             form.bloodType         || undefined,
      allergies:             form.allergies.split(',').map(s => s.trim()).filter(Boolean),
      medicalHistory:        form.medicalHistory.trim()        || undefined,
      knownConditions:       form.knownConditions.trim()       || undefined,
      previousPrescriptions: form.previousPrescriptions.trim() || undefined,
      isActive:              initialValues?.isActive ?? true,
    }
    onSave(patient)
  }

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Patient' : 'Add Patient'}</SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-4 mt-4 pb-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">First Name *</Label>
              <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Maria" />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name *</Label>
              <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Santos" />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          {/* DOB + Sex */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date of Birth</Label>
              <Input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sex *</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
            </div>
          </div>

          {/* Phone + Blood Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phone *</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09171234567" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Blood Type</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={form.bloodType}
                onChange={e => set('bloodType', e.target.value)}
              >
                <option value="">Unknown</option>
                {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label className="text-xs">Email (optional)</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@email.com" />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label className="text-xs">Address *</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 12 Rizal St, Quezon City" />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          {/* Allergies */}
          <div className="space-y-1">
            <Label className="text-xs">Allergies (comma-separated, or "None")</Label>
            <Input value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Aspirin" />
          </div>

          {/* Medical History */}
          <div className="space-y-1">
            <Label className="text-xs">Medical History</Label>
            <textarea
              className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
              rows={3}
              value={form.medicalHistory}
              onChange={e => set('medicalHistory', e.target.value)}
              placeholder="Past diagnoses, surgeries, hospitalizations…"
            />
          </div>

          {/* Known Conditions */}
          <div className="space-y-1">
            <Label className="text-xs">Known Conditions</Label>
            <Input value={form.knownConditions} onChange={e => set('knownConditions', e.target.value)} placeholder="e.g. Hypertension, Type 2 Diabetes" />
          </div>

          {/* Previous Prescriptions */}
          <div className="space-y-1">
            <Label className="text-xs">Previous Prescriptions</Label>
            <textarea
              className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
              rows={2}
              value={form.previousPrescriptions}
              onChange={e => set('previousPrescriptions', e.target.value)}
              placeholder="e.g. Amlodipine 5mg, Metformin 500mg…"
            />
          </div>
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Add Patient'}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
