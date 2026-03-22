import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createInvoicesRouter } from '../../routes/invoices.js';

const MOCK_INVOICE = {
  id:               'inv1',
  invoiceNumber:    'INV-001',
  patientId:        'pt1',
  appointmentId:    'appt1',
  status:           'SENT',
  totalAmountCents: 15000,
  issuedAt:         new Date('2026-03-01'),
  dueAt:            new Date('2026-03-15'),
  paidAt:           null,
  createdAt:        new Date('2026-03-01'),
  updatedAt:        new Date('2026-03-01'),
  patient:          { firstName: 'John', lastName: 'Doe' },
  lineItems: [
    { id: 'li1', description: 'Consultation', quantity: 1, unitPriceCents: 15000, totalCents: 15000 },
  ],
};

function buildPrisma({ invoiceOverride } = {}) {
  return {
    invoice: {
      findMany:  jest.fn().mockResolvedValue([MOCK_INVOICE]),
      count:     jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(
        invoiceOverride !== undefined ? invoiceOverride : MOCK_INVOICE
      ),
    },
    patient: {
      findFirst: jest.fn().mockResolvedValue({ id: 'pt1' }),
    },
  };
}

function buildAuth({ role = 'SECRETARY', tenantId = 't1', userId = 'u1' } = {}) {
  return () => (_req, _res, next) => {
    _req.user     = { id: userId, role };
    _req.tenantId = tenantId;
    return next();
  };
}

function buildApp({ prisma, role, userId } = {}) {
  const app = express();
  app.use(express.json());
  const router = createInvoicesRouter({
    prismaClient:         prisma ?? buildPrisma(),
    authMiddlewareFactory: buildAuth({ role, userId }),
  });
  app.use('/invoices', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: 'internal_error', message: err.message });
  });
  return app;
}

// ── GET /invoices ──────────────────────────────────────────────────────────────

describe('GET /invoices', () => {
  it('returns paginated invoices for the tenant', async () => {
    const app = buildApp();
    const res = await request(app).get('/invoices');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('inv1');
    expect(res.body.pagination.total).toBe(1);
  });

  it('filters by tenantId', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/invoices');
    const call = prisma.invoice.findMany.mock.calls[0][0];
    expect(call.where.tenantId).toBe('t1');
  });

  it('filters by patientId query param', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/invoices?patientId=pt1');
    const call = prisma.invoice.findMany.mock.calls[0][0];
    expect(call.where.patientId).toBe('pt1');
  });

  it('filters by status query param', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/invoices?status=PAID');
    const call = prisma.invoice.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('PAID');
  });

  it('PATIENT role: scopes to own invoices only', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma, role: 'PATIENT', userId: 'u-patient' });
    await request(app).get('/invoices');
    // Should look up patient record first
    expect(prisma.patient.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u-patient' }) })
    );
    const call = prisma.invoice.findMany.mock.calls[0][0];
    expect(call.where.patientId).toBe('pt1');
  });

  it('PATIENT role: returns empty when patient record not found', async () => {
    const prisma = { ...buildPrisma(), patient: { findFirst: jest.fn().mockResolvedValue(null) } };
    const app    = buildApp({ prisma, role: 'PATIENT', userId: 'u-unknown' });
    const res    = await request(app).get('/invoices');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    const app = express();
    app.use(express.json());
    const router = createInvoicesRouter({
      prismaClient:         buildPrisma(),
      authMiddlewareFactory: () => (_req, res) => res.status(401).json({ error: 'unauthorized' }),
    });
    app.use('/invoices', router);
    const res = await request(app).get('/invoices');
    expect(res.status).toBe(401);
  });
});

// ── GET /invoices/:id ──────────────────────────────────────────────────────────

describe('GET /invoices/:id', () => {
  it('returns invoice with line items', async () => {
    const app = buildApp();
    const res = await request(app).get('/invoices/inv1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('inv1');
    expect(res.body.lineItems).toHaveLength(1);
    expect(res.body.patient.firstName).toBe('John');
  });

  it('returns 404 when invoice not found', async () => {
    const prisma = buildPrisma({ invoiceOverride: null });
    const app    = buildApp({ prisma });
    const res    = await request(app).get('/invoices/missing');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('filters by tenantId (tenant isolation)', async () => {
    const prisma = buildPrisma();
    const app    = buildApp({ prisma });
    await request(app).get('/invoices/inv1');
    const call = prisma.invoice.findFirst.mock.calls[0][0];
    expect(call.where.tenantId).toBe('t1');
  });

  it('PATIENT role: returns 403 when invoice belongs to different patient', async () => {
    const otherInvoice = { ...MOCK_INVOICE, patientId: 'pt-other' };
    const prisma = {
      invoice:  { findFirst: jest.fn().mockResolvedValue(otherInvoice) },
      patient:  { findFirst: jest.fn().mockResolvedValue({ id: 'pt1' }) }, // patient is pt1
    };
    const app = buildApp({ prisma, role: 'PATIENT', userId: 'u-patient' });
    const res = await request(app).get('/invoices/inv1');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('PATIENT role: can view their own invoice', async () => {
    const prisma = {
      invoice:  { findFirst: jest.fn().mockResolvedValue(MOCK_INVOICE) },  // patientId: pt1
      patient:  { findFirst: jest.fn().mockResolvedValue({ id: 'pt1' }) }, // patient is pt1
    };
    const app = buildApp({ prisma, role: 'PATIENT', userId: 'u-patient' });
    const res = await request(app).get('/invoices/inv1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('inv1');
  });
});
