export type Role =
  | 'super_admin'
  | 'org_admin'
  | 'branch_manager'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'lab_technician'
  | 'patient'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  tenantId: string
  orgName?: string
  orgAddress?: string
  branchId?: string
  avatarUrl?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl?: string
}

export interface Branch {
  id: string
  tenantId: string
  name: string
  address: string
  phone: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface Patient {
  id: string
  tenantId: string
  userId?: string
  firstName: string
  lastName: string
  fullName: string
  dob?: string
  gender?: string
  bloodType?: string
  phone?: string
  email?: string
  address?: string
  allergies: string[]
  medicalHistory?: string
  knownConditions?: string
  previousPrescriptions?: string
  isActive: boolean
}

export type AppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  tenantId: string
  patientId: string
  patientName: string
  professionalId: string
  professionalName: string
  branchId: string
  scheduledAt: string  // ISO datetime
  durationMins: number
  type: string
  status: AppointmentStatus
  notes?: string
}

export type LabResultStatus = 'pending' | 'available' | 'flagged'

export interface LabResult {
  id: string
  tenantId: string
  patientId: string
  appointmentId?: string
  orderedById?: string
  testName: string
  result?: string
  resultFileUrl?: string
  status: LabResultStatus
  publishedAt?: string
  createdAt: string
}

// ── Professionals ─────────────────────────────────────────────────────────────

export interface Professional {
  id: string
  tenantId: string
  userId: string
  name: string
  specialization: string
  bio?: string
  slotDurationMins: number
  isActive: boolean
  branch: string
}

export interface ProfessionalSchedule {
  id: string
  tenantId: string
  professionalId: string
  branchId: string
  weekday: number   // 0 = Monday … 6 = Sunday
  startTime: string // 'HH:mm'
  endTime: string   // 'HH:mm'
}

export interface TimeOff {
  id: string
  tenantId: string
  professionalId: string
  startDate: string  // 'YYYY-MM-DD'
  endDate: string    // 'YYYY-MM-DD'
  reason: string
}

// ── Clinic Hours ──────────────────────────────────────────────────────────────

export interface ClinicHours {
  id: string
  tenantId: string
  branchId: string
  weekday: number   // 0 = Monday … 6 = Sunday
  openTime: string  // 'HH:mm'
  closeTime: string // 'HH:mm'
  isClosed: boolean
}

export interface SpecialClosure {
  id: string
  tenantId: string
  branchId: string
  date: string   // 'YYYY-MM-DD'
  reason: string
}

// ── User Management ───────────────────────────────────────────────────────────

export interface ManagedUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: Role
  branch?: string
  lastLogin?: string
  isActive: boolean
  type: 'staff' | 'patient'
  phone?: string
  registeredAt?: string
  hasPortalAccess?: boolean
}

// ── Invoicing ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
}

export interface Invoice {
  id: string
  tenantId: string
  invoiceNumber: string
  patientId: string
  patientName: string
  appointmentId?: string
  appointmentDate?: string
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  totalAmountCents: number
  issuedAt: string   // 'YYYY-MM-DD'
  dueAt: string      // 'YYYY-MM-DD'
  paidAt?: string    // 'YYYY-MM-DD'
}
