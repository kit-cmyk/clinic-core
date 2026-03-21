import { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_TIERS } from './seedData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ClinicAlly database...');

  // ── Subscription Tiers ───────────────────────────────────────────────────
  console.log('  › Subscription tiers...');
  for (const tier of SUBSCRIPTION_TIERS) {
    await prisma.subscriptionTier.upsert({
      where: { plan: tier.plan },
      update: {
        name: tier.name,
        maxBranches: tier.maxBranches,
        maxStaff: tier.maxStaff,
        storageLimitBytes: tier.storageLimitBytes,
        monthlyPriceUsd: tier.monthlyPriceUsd,
      },
      create: tier,
    });
  }
  console.log(`  ✓ ${SUBSCRIPTION_TIERS.length} subscription tiers upserted`);

  console.log('✅ Seed complete');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
