# Changelog

All notable changes to ClinicAlly 2.0 will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/):
- PATCH (0.0.x) — bug fixes
- MINOR (0.x.0) — new features, backward compatible
- MAJOR (x.0.0) — breaking changes

---

## [Unreleased]

### Fixed
- CI: backend ESLint config now declares Node.js globals (`process`, `Buffer`) and fetch globals (`fetch`, `FormData`, `Blob`, `AbortSignal`) so all 895 false-positive `no-undef` errors are resolved; Jest globals (`describe`, `it`, `expect`) added for test files
- CI: removed unused imports and variables in backend — `writeAuditLog` (organization.js, tenants.js), `enforceStorageLimit` (tenants.js), `logMap` (provisioning.js), unused `next` arg (auth.js)
- CI: frontend ESLint config disables React Compiler-specific rules introduced by `eslint-plugin-react-hooks` v7 (not applicable without the React Compiler); `.vite/deps/**` and `src/components/ui/**` (shadcn generated files) added to ignore list
- CI: frontend `no-unused-vars` now respects `_`-prefixed variables (consistent with backend convention)
- CI: removed unused `Sentry` import from `App.tsx` (TypeScript TS6133 build error)
- CI: extracted `MOCK_PATIENTS` data to `src/data/mockPatients.ts` and `ClinicService` / `INITIAL_SERVICES` to `src/data/clinicServices.ts` so component files export only components (fixes `react-refresh/only-export-components` in `PatientForm.tsx` and `SettingsPage.tsx`)
- CI: extracted `ComingSoon` component from `router/index.tsx` to `src/components/ComingSoon.tsx` (fixes `react-refresh/only-export-components` in router file)
- CI: replaced ternary side-effect expressions with `if/else` in `AppointmentVisitPage.tsx` (fixes `@typescript-eslint/no-unused-expressions`)
- CI: `let offset` → `const offset` in `AppointmentsPage.tsx`; `setProgress(0)` moved from effect body to `handleSubmit` in `PortalUploadPage.tsx`; `setLogoPreview(null)` moved to effect cleanup in `OnboardingPage.tsx`

### Changed
- Rebranded application name from ClinicCore to ClinicAlly across all pages, layouts, metadata, and documentation

### Added
- Tenant CRUD API: GET/POST /api/v1/tenants + GET/PUT /api/v1/tenants/:id + GET /api/v1/tenants/:id/storage-usage; SUPER_ADMIN only; slug validation; BigInt serialisation; P2002 → 409, P2025 → 404; 19 Jest tests (CC-28, CC-31)
- Storage limit enforcement middleware: enforceStorageLimit() blocks uploads exceeding tenant limit with HTTP 413; SUPER_ADMIN bypass; fail-open on storage service errors; getTenantStorageUsed() sums Supabase Storage file sizes; 17 Jest tests (CC-30, CC-31)
- Dashboard CC-111 to CC-117 widgets: AppointmentTimeline (vertical timeline with gap indicators), CheckInQueue (wait-time colour-coded list), PendingActionsBar (role-filtered amber chips), SlotUtilizationBar (inline progress bar per professional), QuickActionBar (role-gated quick actions), WalkInSlotFinder (first-available slot with one-click booking), AppointmentStatusBar (stacked status breakdown) (CC-111, CC-112, CC-113, CC-114, CC-115, CC-116, CC-117)
- TenantsPage staff tab: DropdownMenu with MoreHorizontal trigger for Send Password Reset / Deactivate / Reactivate row actions (CC-94, CC-95)
- AppointmentsPage: converted custom Modal to Sheet side drawer for New Appointment and Appointment detail/edit/delete flows (CC-94)
- Subscription Plan CRUD API: GET/POST /api/v1/plans + PUT/DELETE /api/v1/plans/:id; SUPER_ADMIN writes, any auth user reads; isActive soft-delete; BigInt/Decimal serialisation; 8 Jest tests (CC-26)
- SMS Patient Registration: POST /api/v1/patients/invite (E.164 validation, 48h token, Twilio SMS via injectable factory); POST /api/v1/patients/register/:token (used/expired 410, creates Supabase user + Prisma Patient); PatientInvite Prisma model; 9 Jest tests (CC-24)
- Auth & RBAC test suite: rewrote requireAuth middleware tests to use injectable supabaseAdmin mock; all 6-role requireRole coverage; tenant isolation tests migrated to injectable mock pattern; 212 tests passing, 0 failures (CC-25)
- Super Admin Platform Overview dashboard: live KPI cards (active tenants, MRR, storage, pending sign-ups), tenant growth chart, plan distribution, platform alerts (announcements + maintenance), sortable tenant health table; replaces all mock data with real API calls; refresh button with cache-bust; loading skeleton + error state (CC-129)
- Global Master Data API: GET/POST/PATCH /api/v1/master/specialties, /appointment-types, /service-categories; SUPER_ADMIN writes, any auth user reads; Prisma models Specialty, AppointmentType, ServiceCategory; 8 Jest tests (CC-121)
- Tenant Sign-Up Request API: POST /api/v1/tenant-requests (public), GET (list/detail), POST approve/reject with required reason; TenantRequest Prisma model + TenantRequestStatus enum; 9 Jest tests (CC-119)
- Platform Updates API: GET/POST /api/v1/platform/announcements + archive patch; GET/POST/PATCH feature-flags; GET/POST /maintenance + cancel patch; Announcement, FeatureFlag, MaintenanceWindow Prisma models; 9 Jest tests (CC-126)
- Platform Metrics API: GET /api/v1/metrics — active tenants, MRR, storage sum, plan breakdown, tenant list; 5-minute in-memory cache with bust endpoint; BigInt-safe JSON serialisation; 6 Jest tests (CC-124)
- Tenant Provisioning Pipeline API: GET/POST /api/v1/provisioning/:id (start, status), POST retry/:step; 4-step orchestration service (DB_RECORD → ROLES_SEED → STORAGE_SETUP → WELCOME_EMAIL); ProvisioningLog Prisma model; idempotent retry; 7 Jest tests (CC-122)
- Prisma schema: TenantRequest + TenantRequestStatus enum, ProvisioningLog + ProvisioningStep/ProvisioningStepStatus enums, Specialty, AppointmentType, ServiceCategory, Announcement + AnnouncementSeverity enum, FeatureFlag, MaintenanceWindow
- Provisioning Status UI: ProvisioningPage at /admin/provisioning/:tenantId — vertical stepper showing 4-step pipeline (DB record, roles seed, storage setup, welcome email) with per-step status icons (pending/running/done/failed), error message display, and Retry button for failed steps; overall status badge; "View Tenant" button on completion; 4 Vitest tests (CC-123)
- Platform Monitoring Dashboard: MonitoringPage at /admin/monitoring — 4 KPI cards (active tenants, MRR, storage used, plans breakdown), CSS bar chart for 6-month MRR trend, sortable tenant health table with storage progress bars and status badges; 4 Vitest tests (CC-125)
- Platform Updates UI: PlatformUpdatesPage at /admin/updates — Announcements table with Create Sheet and Archive AlertDialog, Feature Flags toggle rows (On/Off per plan), Maintenance Mode card showing active window with Cancel confirmation; 4 Vitest tests (CC-127)
- Global Master Data UI: MasterDataPage at /admin/master-data — 3-tab interface (Specialties, Appointment Types, Service Categories) with add/edit Sheet and deactivate AlertDialog; 4 Vitest tests (CC-118)
- Tenant Sign-Up Review UI: SignUpsPage at /admin/sign-ups — filter tabs (All/Pending/Approved/Rejected), click-to-open side panel with full contact details, Approve button, Reject with required reason AlertDialog; 4 Vitest tests (CC-120)
- RBAC permission system: PERMISSION_SCOPES (PLATFORM/ORGANIZATION/CLINICAL) + full PERMISSIONS matrix (resource:action → roles[]); requirePermission() middleware factory; fails closed on unknown keys; 53 tests (CC-20)
- Supabase Auth endpoints: POST /api/v1/auth/signup, /login, /logout, /refresh; injectable factory pattern for full unit testability; rollback on Prisma failure; 18 tests (CC-18)
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
