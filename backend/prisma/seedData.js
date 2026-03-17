// Seed data constants — imported by both prisma/seed.js and tests.
// Keeping data separate from execution allows test imports without side effects.

export const SUBSCRIPTION_TIERS = [
  {
    plan: 'FREE',
    name: 'Free',
    maxBranches: 1,
    maxStaff: 5,
    storageLimitBytes: BigInt(1 * 1024 * 1024 * 1024), // 1 GB
    monthlyPriceUsd: 0,
  },
  {
    plan: 'BASIC',
    name: 'Basic',
    maxBranches: 3,
    maxStaff: 20,
    storageLimitBytes: BigInt(5 * 1024 * 1024 * 1024), // 5 GB
    monthlyPriceUsd: 29,
  },
  {
    plan: 'PRO',
    name: 'Pro',
    maxBranches: -1, // unlimited
    maxStaff: -1,    // unlimited
    storageLimitBytes: BigInt(20 * 1024 * 1024 * 1024), // 20 GB
    monthlyPriceUsd: 99,
  },
  {
    plan: 'ENTERPRISE',
    name: 'Enterprise',
    maxBranches: -1,
    maxStaff: -1,
    storageLimitBytes: BigInt(100 * 1024 * 1024 * 1024), // 100 GB
    monthlyPriceUsd: 299,
  },
];

export const ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'DOCTOR', 'NURSE', 'SECRETARY', 'PATIENT'];
