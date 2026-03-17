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
