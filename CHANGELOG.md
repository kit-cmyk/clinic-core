# Changelog

All notable changes to ClinicCore are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [0.3.0] — 2026-03-22

### Added
- Forgot Password page (`/forgot-password`) — email input triggers Supabase `resetPasswordForEmail`, sends reset link to inbox
- Reset Password page (`/reset-password`) — handles Supabase `PASSWORD_RECOVERY` session, validates new password + confirm, calls `updateUser`, signs out and redirects to login
- Auth split-screen layout (`AuthLayout`) applied to all auth pages: Login, Register, Invite Accept, Forgot Password, Reset Password

### Changed
- Login page "Forgot password?" upgraded from a non-functional `<button>` to a `<Link to="/forgot-password">`
- Wired all major frontend pages to real backend APIs (CC-137):
  - `AppointmentsPage` — real `GET/POST/PUT/DELETE /api/v1/appointments`
  - `DashboardPage` — live appointments + patients data
  - `PatientManagementPage` — real `GET /api/v1/patients` with search and filter
  - `ProfessionalsPage` — real professionals API
  - `InvoicesPage` — real `GET /api/v1/invoices`

---

## [0.2.0] — 2026-03-21

### Added — Clinical Operations Backend (Sprint 2)
- Review queue API: `GET /api/v1/review-queue`, `PUT /:id/status`, `PUT /:id/verify`
- Notifications API: `GET /api/v1/notifications`, `PUT /:id/read`
- EMR visits API: `GET/POST/PUT /api/v1/patients/:id/emr`
- Prescriptions API: `POST/GET/PUT /api/v1/prescriptions` (DOCTOR-only create)
- Appointments API: `POST/GET/PUT/DELETE /api/v1/appointments` — double-booking detection (409)
- Patient check-in: `POST /api/v1/appointments/:id/check-in` — atomic `$transaction`
- 339 backend tests passing (22 suites), 0 failures
- New Prisma models: `EmrVisit`, `Prescription`, `Notification`
- `useIdleLogout` hook: 15-min HIPAA auto-logout
- Sentry PHI scrubber, audit log on all sensitive routes

---

## [0.1.0] — 2026-03-21

### Added — Platform Foundation + Super Admin (Sprint 1)
- Monorepo scaffold: React 19 + Vite 6 / Node.js + Express / Supabase PostgreSQL + Prisma 5
- Multi-tenant DB schema, Supabase Auth, RBAC, staff invitations, SMS patient registration
- Subscription plans, Tenant CRUD, storage limit enforcement APIs
- Super Admin portal: plans, tenants, monitoring, provisioning, master data, platform updates
- 240 backend tests passing (18 suites)
- Dashboard widgets (mock data): AppointmentTimeline, CheckInQueue, PendingActionsBar, SlotUtilizationBar, QuickActionBar, WalkInSlotFinder, AppointmentStatusBar
- UI standards: Sheet pattern for all forms, DropdownMenu+MoreHorizontal for all row actions
- GitHub Actions CI, HIPAA_COMPLIANCE.md, UPTIME_MONITORING.md
