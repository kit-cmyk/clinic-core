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
  { id: 'pt1', tenantId: 't1', firstName: 'John',    lastName: 'Doe',       fullName: 'John Doe',       dob: '1985-03-12', gender: 'Male',   phone: '09171234567', email: 'john.doe@email.com',      allergies: [],          isActive: true  },
  { id: 'pt2', tenantId: 't1', firstName: 'Maria',   lastName: 'Chen',      fullName: 'Maria Chen',     dob: '1990-07-22', gender: 'Female', phone: '09181234567', email: 'maria.chen@email.com',     allergies: ['Penicillin'], isActive: true  },
  { id: 'pt3', tenantId: 't1', firstName: 'Carlos',  lastName: 'Rivera',    fullName: 'Carlos Rivera',  dob: '1978-11-05', gender: 'Male',   phone: '09191234567', email: 'carlos.rivera@email.com',  allergies: [],          isActive: true  },
  { id: 'pt4', tenantId: 't1', firstName: 'Priya',   lastName: 'Sharma',    fullName: 'Priya Sharma',   dob: '1995-02-18', gender: 'Female', phone: '09201234567', email: 'priya.sharma@email.com',   allergies: ['Aspirin'], isActive: true  },
  { id: 'pt5', tenantId: 't1', firstName: 'Tom',     lastName: 'Wilson',    fullName: 'Tom Wilson',     dob: '1982-09-30', gender: 'Male',   phone: '09211234567', email: 'tom.wilson@email.com',     allergies: [],          isActive: true  },
  { id: 'pt6', tenantId: 't1', firstName: 'Sara',    lastName: 'Ahmed',     fullName: 'Sara Ahmed',     dob: '1992-04-14', gender: 'Female', phone: '09221234567', email: 'sara.ahmed@email.com',     allergies: [],          isActive: true  },
  { id: 'pt7', tenantId: 't1', firstName: 'James',   lastName: 'Liu',       fullName: 'James Liu',      dob: '1975-12-01', gender: 'Male',   phone: '09231234567', email: 'james.liu@email.com',      allergies: ['Sulfa'],   isActive: false },
  { id: 'pt8', tenantId: 't1', firstName: 'Anna',    lastName: 'Kowalski',  fullName: 'Anna Kowalski',  dob: '1988-06-25', gender: 'Female', phone: '09241234567', email: 'anna.kowalski@email.com',  allergies: [],          isActive: true  },
  { id: 'pt9', tenantId: 't1', firstName: 'Aisha',   lastName: 'Patel',     fullName: 'Aisha Patel',    dob: '1998-08-09', gender: 'Female', phone: '09251234567', email: 'aisha.patel@email.com',    allergies: [],          isActive: true  },
]

// ── Types ──────────────────────────────────────────────────────────────────────

type PatientFormValues = {
  firstName: string
  lastName: string
  dob: string
  gender: string
  phone: string
  email: string
}

type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>

interface PatientFormProps {
  open: boolean
  onClose: () => void
  onSave: (patient: Patient) => void
  initialValues?: Partial<Patient>
}

const EMPTY: PatientFormValues = { firstName: '', lastName: '', dob: '', gender: 'Male', phone: '', email: '' }

function toValues(p?: Partial<Patient>): PatientFormValues {
  if (!p) return EMPTY
  return {
    firstName: p.firstName ?? '',
    lastName:  p.lastName  ?? '',
    dob:       p.dob       ?? '',
    gender:    p.gender    ?? 'Male',
    phone:     p.phone     ?? '',
    email:     p.email     ?? '',
  }
}

function validate(v: PatientFormValues): PatientFormErrors {
  const e: PatientFormErrors = {}
  if (!v.firstName.trim()) e.firstName = 'Required'
  if (!v.lastName.trim())  e.lastName  = 'Required'
  if (!v.dob.trim())       e.dob       = 'Required'
  if (!v.gender.trim())    e.gender    = 'Required'
  if (!v.phone.trim())     e.phone     = 'Required'
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
      id:        initialValues?.id  ?? `pt-${Date.now()}`,
      tenantId:  initialValues?.tenantId ?? 't1',
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      fullName:  `${form.firstName.trim()} ${form.lastName.trim()}`,
      dob:       form.dob,
      gender:    form.gender,
      phone:     form.phone.trim(),
      email:     form.email.trim() || undefined,
      allergies: initialValues?.allergies ?? [],
      isActive:  initialValues?.isActive  ?? true,
    }
    onSave(patient)
  }

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Patient' : 'Add Patient'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">First Name *</Label>
              <Input
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="e.g. Maria"
                aria-label="First name"
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="e.g. Santos"
                aria-label="Last name"
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date of Birth *</Label>
              <Input
                type="date"
                value={form.dob}
                onChange={e => set('dob', e.target.value)}
                aria-label="Date of birth"
              />
              {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sex *</Label>
              <select
                aria-label="Sex"
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

          <div className="space-y-1">
            <Label className="text-xs">Phone *</Label>
            <Input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="e.g. 09171234567"
              aria-label="Phone"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Email (optional)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="e.g. patient@email.com"
              aria-label="Email"
            />
          </div>
        </div>

        <SheetFooter className="mt-4">
          <Button onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Add Patient'}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
