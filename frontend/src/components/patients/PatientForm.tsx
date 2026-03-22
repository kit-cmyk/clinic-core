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
              <Label htmlFor="firstName" className="text-xs">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Maria" />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
              <Input id="lastName" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Santos" />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          {/* DOB + Sex */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dob" className="text-xs">Date of Birth</Label>
              <Input id="dob" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
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
              <Label htmlFor="phone" className="text-xs">Phone *</Label>
              <Input id="phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09171234567" />
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
