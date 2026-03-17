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
