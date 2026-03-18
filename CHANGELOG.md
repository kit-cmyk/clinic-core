# Changelog

All notable changes to ClinicCore 2.0 will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/):
- PATCH (0.0.x) — bug fixes
- MINOR (0.x.0) — new features, backward compatible
- MAJOR (x.0.0) — breaking changes

---

## [Unreleased]

### Added
- Dashboard Book Appointment widget: BookAppointmentSheet component with patient combobox (inline create), professional select, date/time/type/duration fields, success confirmation; pre-fills when clicking from Professionals Today card (CC-102)
- Dashboard Professionals Today widget: lists all professionals with Available/Off today badge, per-day appointment count, click-to-book integration; driven by PROF_SCHEDULES weekday data (CC-103)
- PatientForm component: reusable Sheet form for creating/editing patients; exports MOCK_PATIENTS array shared across pages; validates first name, last name, DOB, gender, phone; 4 Vitest tests (CC-104)
- PatientManagementPage: patient table at /patients with search filter, status badge, row-actions dropdown (edit, view chart, activate/deactivate), inline PatientForm for create/edit; 4 Vitest tests (CC-105)
- Professional specialization filter on ProfessionalsPage: select dropdown alongside branch filter, AND logic applied, unique specializations derived from mock data (CC-106)
- Holiday syncing on ClinicHoursPage: country selector + Sync Holidays button fetches from Nager.Date API, auto-populates Special Closures for active branch, skips duplicates, shows success/error message; 4 Vitest tests (CC-107)
- AppointmentsPage patient combobox: searchable patient selector with inline PatientForm for new patients; Start Visit button for doctor/nurse roles navigating to /appointments/:id/visit (CC-108)
- AppointmentVisitPage: 3-tab page at /appointments/:id/visit — Lab Records (upload/view), Patient History (timeline of past visits), Billing (quick-add + line items + draft invoice creation); 4 Vitest tests (CC-109, CC-110)
- Professional Profiles & Schedule Management: ProfessionalsPage with profile list, 3-tab expandable panel (edit profile, weekly schedule, time-off), branch filter; Prisma models: Professional, ProfessionalSchedule, TimeOff; 4 Vitest tests (CC-80 / CC-84, CC-85)
- Clinic Hours Management: ClinicHoursPage with per-branch hours grid (Mon–Sun open/close/isClosed), special closures section with add/remove; Prisma models: ClinicHours, SpecialClosure; 4 Vitest tests (CC-81 / CC-86, CC-87)
- User Management for Admins: UserManagementPage with Staff/Patients tabs, search filter, activate/deactivate, change role, resend invite, view chart link; mock data: 8 staff + 6 patients; 4 Vitest tests (CC-82 / CC-88)
- Patient Visit Invoicing: InvoicesPage (admin) with invoice list, status filter tabs, line item editor, create modal, Send/Pay actions; PortalInvoicesPage (patient) with outstanding balance, expandable line items; Prisma models: Invoice, InvoiceLineItem, InvoiceStatus enum; 8 Vitest tests (CC-83 / CC-89, CC-90, CC-91)
- Sidebar nav: added Professionals, Clinic Hours, Users nav items (org_admin, branch_manager); wired Billing to InvoicesPage (CC-92)
- Router: added /professionals, /clinic-hours, /users, /billing (InvoicesPage), /portal/invoices routes (CC-92)
- TypeScript types: Professional, ProfessionalSchedule, TimeOff, ClinicHours, SpecialClosure, ManagedUser, InvoiceStatus, InvoiceLineItem, Invoice interfaces added to types/index.ts
- Initial project setup: README, CHANGELOG, TESTING, .env.example
- 9 Epics and 69 tasks created in Jira (CC-1 to CC-78)
- Backend project structure: Node.js/Express with ESM, folder scaffold, ESLint, Prettier, nodemon (CC-10)
- Slack dual-channel notification system with outbound webhooks and bot-token response reading (Phase 22)
- Frontend project structure: React 19 + Vite 6 + TypeScript, Tailwind CSS v4 with full oklch design token theme, React Router v7, Vitest + React Testing Library, folder scaffold (CC-11)
- shadcn/ui component library: Button, Card, Input, Label, Badge, Separator with New York style (CC-11)
- App shell: responsive sidebar layout (AppLayout) with role-based nav, mobile drawer + overlay (CC-11)
- Auth layout: centered card wrapper for login/register flows (CC-11)
- Login page: email/password form with validation and loading state, stub auth ready for CC-18 (CC-11)
- Dashboard page: stat cards (appointments, patients, lab, billing) and today's appointments list with status badges (CC-11)
- 4 passing unit/integration tests covering login form validation and 404 routing (CC-11)
- PostgreSQL multi-tenant schema via Prisma 5: tenants, subscription_tiers, users, organizations, branches, staff_assignments, invitations — all tenant-scoped tables carry indexed tenant_id FK (CC-12)
- Seed script: 4 subscription tiers (FREE/BASIC/PRO/ENTERPRISE) with storage limits and pricing (CC-12)
- Prisma client singleton at backend/src/models/prisma.js with dev hot-reload safety (CC-12)
