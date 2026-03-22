import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SUBSCRIPTION_TIERS, ROLES } from '../../prisma/seedData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '../../prisma/schema.prisma');
const schema = readFileSync(schemaPath, 'utf-8');

describe('schema.prisma — Role enum', () => {
  it('defines all 6 roles', () => {
    for (const role of ROLES) {
      expect(schema).toContain(role);
    }
  });
});

describe('schema.prisma — SubscriptionPlan enum', () => {
  it('defines all 4 subscription plans', () => {
    for (const tier of SUBSCRIPTION_TIERS) {
      expect(schema).toContain(tier.plan);
    }
  });
});

describe('schema.prisma — tenant isolation', () => {
  it('tenant-scoped tables are mapped correctly', () => {
    const tenantScopedTables = [
      'users', 'organizations', 'branches', 'staff_assignments', 'invitations',
      'patients', 'appointments', 'lab_results', 'professionals',
      'professional_schedules', 'time_offs', 'clinic_hours',
      'special_closures', 'invoices', 'invoice_line_items',
    ];
    for (const table of tenantScopedTables) {
      expect(schema).toContain(`@@map("${table}")`);
    }
  });

  it('has tenantId field on every tenant-scoped model', () => {
    const matches = schema.match(/tenantId\s+String\b/g) || [];
    expect(matches.length).toBe(20);
  });

  it('indexes tenantId on every tenant-scoped model', () => {
    const indexes = schema.match(/@@index\(\[tenantId\]\)/g) || [];
    expect(indexes.length).toBe(20);
  });
});

describe('Seed data — subscription tiers', () => {
  it('has exactly 4 tiers', () => {
    expect(SUBSCRIPTION_TIERS).toHaveLength(4);
  });

  it('covers all SubscriptionPlan values', () => {
    const plans = SUBSCRIPTION_TIERS.map((t) => t.plan);
    expect(plans).toContain('FREE');
    expect(plans).toContain('BASIC');
    expect(plans).toContain('PRO');
    expect(plans).toContain('ENTERPRISE');
  });

  it('all tiers have required fields', () => {
    const requiredFields = ['plan', 'name', 'maxBranches', 'maxStaff', 'storageLimitBytes', 'monthlyPriceUsd'];
    for (const tier of SUBSCRIPTION_TIERS) {
      for (const field of requiredFields) {
        expect(tier).toHaveProperty(field);
      }
    }
  });

  it('FREE tier: 1 branch, 5 staff, $0/month', () => {
    const free = SUBSCRIPTION_TIERS.find((t) => t.plan === 'FREE');
    expect(free.maxBranches).toBe(1);
    expect(free.maxStaff).toBe(5);
    expect(free.monthlyPriceUsd).toBe(0);
  });

  it('PRO and ENTERPRISE tiers: unlimited branches and staff (-1)', () => {
    for (const plan of ['PRO', 'ENTERPRISE']) {
      const tier = SUBSCRIPTION_TIERS.find((t) => t.plan === plan);
      expect(tier.maxBranches).toBe(-1);
      expect(tier.maxStaff).toBe(-1);
    }
  });
});
