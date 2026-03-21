# ClinicAlly

Multi-tenant SaaS clinic management platform — manage multiple clinic branches, clinical staff, patients, appointments, lab records, and billing under a single unified platform.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (PWA) |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Auth | Supabase Auth (JWT + SMS OTP) |
| File Storage | AWS S3 |
| Hosting | Render |
| CI/CD | GitHub Actions |

## Project Structure

```
clinic-core/
├── frontend/          # React + Vite SPA (PWA)
├── backend/           # Node.js + Express API
├── prisma/            # Database schema + migrations
├── .github/workflows/ # CI/CD pipelines
├── CHANGELOG.md       # Version history
├── TESTING.md         # Client testing guide
└── .env.example       # Required environment variables
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- AWS S3 bucket
- Supabase project

### Setup

```bash
# Clone
git clone https://github.com/kit-cmyk/clinic-core.git
cd clinic-core

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in all required values in .env

# Run database migrations
npx prisma migrate dev

# Start development
npm run dev
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys every Wednesday via GitHub Actions |
| `develop` | Integration — staging deploys on every merge |
| `feature/CC-XX-description` | Feature branches — one branch per Jira task |

## Key Architectural Rules

- Every database query must filter by `tenant_id` — no exceptions
- All file uploads go through malware scanning before reaching S3
- S3 keys follow the pattern `/{tenant_id}/{category}/{filename}`
- Supabase JWT must be validated on every protected API endpoint
- Never push directly to `main` or `develop` — always via PR

## Documentation

- [Jira Project](https://flowsentry.atlassian.net/jira/software/c/projects/CC)
- [Confluence Space](https://flowsentry.atlassian.net/wiki/spaces/CC)
- [Product Context Summary](https://flowsentry.atlassian.net/wiki/spaces/CC/pages/393405)
- [Stack Decision](https://flowsentry.atlassian.net/wiki/spaces/CC/pages/229846)
- [Session Memory](https://flowsentry.atlassian.net/wiki/spaces/CC/pages/393425)
