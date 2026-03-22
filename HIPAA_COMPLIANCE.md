# HIPAA Technical Safeguards — Compliance Audit

> Last reviewed: 2026-03-21
> Scope: ClinicAlly SaaS platform (backend API + frontend SPA + Supabase + Render)

This document audits the platform against the HIPAA Security Rule Technical Safeguards (45 CFR § 164.312). Each control is marked **✅ Done**, **⚠️ Partial**, or **❌ Gap** with remediation steps where required.

---

## 1. Access Control (§ 164.312(a)(1))

### 1a. Unique User Identification
> Assign a unique name/number to each user for tracking identity.

**✅ Done** — Every user has a UUID (`User.id`) and a unique Supabase auth UID (`supabaseUserId`). No shared accounts.

### 1b. Emergency Access Procedure
> Establish a procedure for obtaining ePHI during an emergency.

**❌ Gap** — No documented break-glass procedure exists.
**Remediation:** Document a process (e.g., SUPER_ADMIN can reset credentials; direct DB access via Supabase SQL editor with service_role key for emergencies). Store procedure in a secure runbook.

### 1c. Automatic Logoff
> Implement electronic procedures that terminate a session after inactivity.

**⚠️ Partial** — Supabase JWTs expire (default 1 hour). Frontend does not implement an inactivity timer.
**Remediation:** Add a frontend inactivity timer (e.g., 15–30 minutes) that calls `/api/v1/auth/logout` and redirects to `/login`. Use `@idlejs/idle` or a Zustand timer.

### 1d. Encryption and Decryption
> Implement a mechanism to encrypt and decrypt ePHI.

**⚠️ Partial** — Data is encrypted at rest by Supabase (AES-256) and in transit via HTTPS (TLS). Application-layer encryption of specific PHI fields (e.g., `Patient.dob`, `Patient.phone`, `Patient.allergies`) is **not implemented**.
**Remediation:** Use `pgcrypto` extension in Postgres to encrypt sensitive columns, or encrypt at the application layer before writing to Prisma. Minimum fields: `dob`, `phone`, `allergies`, `bloodType`.

---

## 2. Audit Controls (§ 164.312(b))
> Implement hardware, software, and/or procedural mechanisms that record and examine activity in systems containing ePHI.

**⚠️ Partial** — Audit logging infrastructure exists (`AuditLog` table, `writeAuditLog()`, `req.audit()`). Currently only auth events are logged.
**Remediation:** Extend audit logging to cover:
- [ ] `patient.viewed` — every GET /patients/:id
- [ ] `patient.listed` — every GET /patients (with search terms in metadata)
- [ ] `patient.updated` — every PATCH/PUT on a patient record
- [ ] `patient.deleted` — soft or hard deletes
- [ ] `lab_result.viewed` — every GET /lab-results/:id
- [ ] `lab_result.uploaded` — file upload events
- [ ] `appointment.viewed` — access to appointment details
- [ ] `invoice.viewed` — billing data access
- [ ] `user.role_changed` — privilege escalation events
- [ ] `user.deactivated` — access revocation
- [ ] `file.downloaded` — signed URL generation for lab results/documents

Audit logs must be **retained for a minimum of 6 years**. Add a retention policy (do not delete audit_logs rows; archive to cold storage after 2 years).

---

## 3. Integrity (§ 164.312(c)(1))
> Implement policies to protect ePHI from improper alteration or destruction.

### 3a. Authentication of ePHI
**⚠️ Partial** — No checksums or digital signatures on stored ePHI records.
**Remediation (low priority for v1):** Consider storing a SHA-256 hash of critical records (lab results, prescriptions) at write time to detect tampering.

### 3b. Transmission Integrity
**✅ Done** — TLS enforced by Render (HTTPS). Supabase Storage uses HTTPS for all file transfers.

---

## 4. Person/Entity Authentication (§ 164.312(d))
> Implement procedures to verify that a person seeking access is who they claim to be.

**✅ Done** — Supabase Auth handles password hashing (bcrypt), JWT issuance, and token validation. RBAC enforced on every route via `requireAuth` + `requirePermission`.

**⚠️ Gap** — No multi-factor authentication (MFA) enforced.
**Remediation:** Enable MFA in Supabase Auth dashboard for DOCTOR, ORG_ADMIN, and SUPER_ADMIN roles. Supabase supports TOTP (authenticator apps) natively. Enforce via Supabase Auth settings (not optional for staff accessing clinical data).

---

## 5. Transmission Security (§ 164.312(e)(1))
> Implement technical security measures to guard against unauthorised access to ePHI transmitted over an electronic network.

**✅ Done** — All communication is over HTTPS (TLS 1.2+):
- Render enforces HTTPS on all services
- Supabase endpoints are HTTPS-only
- CORS restricts origins to `FRONTEND_URL` in production
- Helmet sets `Strict-Transport-Security` (HSTS)

---

## 6. Additional HIPAA Requirements

### 6a. Business Associate Agreements (BAAs)
**❌ Gap** — BAAs must be signed with all vendors who process ePHI.
**Required BAAs:**
- [ ] **Supabase** — processes ePHI (DB + Storage). Supabase offers BAAs on paid plans. [supabase.com/security](https://supabase.com/security)
- [ ] **Render** — hosts the API server. Render offers BAAs. [render.com/hipaa](https://render.com/docs/hipaa)
- [ ] **Twilio** — transmits patient phone numbers for SMS invites. Twilio offers BAAs. [twilio.com/hipaa](https://www.twilio.com/en-us/hipaa)
- [ ] **Sentry** — receives error data which may include ePHI in stack traces. Configure Sentry to scrub PII/PHI from error payloads before enabling. Sentry offers BAAs on Business+ plans.

### 6b. Minimum Necessary Standard
> Only access the minimum ePHI necessary to perform a function.

**⚠️ Partial** — API responses return full patient records regardless of the requester's role.
**Remediation:** Scope Prisma `select` clauses by role. Example: a NURSE viewing patients should not receive `invoices` or `labResults` unless explicitly accessing those routes.

### 6c. Data Retention & Deletion
**❌ Gap** — No data retention policy or patient data deletion mechanism exists.
**Remediation:**
- [ ] Implement a soft-delete on `Patient` records (set `isActive = false`, do not hard-delete)
- [ ] Implement a GDPR/HIPAA right-to-erasure endpoint for patients: anonymise PII fields (`firstName → "Deleted"`, `phone → null`, etc.) rather than deleting (to preserve audit trail integrity)
- [ ] Document retention periods (HIPAA requires 6 years for medical records)

### 6d. Workforce Training
**❌ Gap** — No documented security awareness training for staff who use the platform.
**Remediation:** Establish annual HIPAA training policy. Document in a policy document.

### 6e. Contingency Plan / Disaster Recovery
**⚠️ Partial** — Supabase provides automated daily backups. No documented recovery procedure.
**Remediation:**
- [ ] Document RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
- [ ] Test a DB restore from Supabase backup at least quarterly
- [ ] Document the restore procedure in the runbook

### 6f. PHI in Logs
**❌ Gap** — Pino logs request bodies in development. In production, request bodies are not logged by default via pino-http, but error stack traces captured by Sentry may contain ePHI.
**Remediation:**
- Configure `pino-http` to redact sensitive fields: `{ redact: ['req.body.password', 'req.body.phone', 'req.body.dob'] }`
- Configure Sentry `beforeSend` hook to scrub ePHI from error payloads before transmission

---

## Priority Remediation Roadmap

| Priority | Item | Effort |
|---|---|---|
| 🔴 Critical | Sign BAAs with Supabase, Render, Twilio | Low (admin) |
| 🔴 Critical | Enable MFA for clinical staff roles | Low (Supabase dashboard) |
| 🔴 Critical | Extend audit logging to all ePHI access | Medium |
| 🟠 High | Implement automatic session logoff | Small (frontend) |
| 🟠 High | Redact PHI from pino + Sentry | Small |
| 🟠 High | Implement patient data erasure endpoint | Medium |
| 🟡 Medium | Application-layer encryption of PHI fields | High |
| 🟡 Medium | Document emergency access procedure | Low |
| 🟡 Medium | Test + document DB restore procedure | Low |
| 🟢 Low | Minimum-necessary field scoping by role | High |
| 🟢 Low | Document workforce training policy | Low |
