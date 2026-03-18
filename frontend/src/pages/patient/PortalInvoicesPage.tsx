import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Invoice, InvoiceStatus } from '@/types'

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1', tenantId: 't1', invoiceNumber: 'INV-2026-001',
    patientId: 'me', patientName: 'John Doe',
    appointmentDate: '2026-03-18',
    status: 'paid',
    lineItems: [
      { id: 'li1', invoiceId: 'inv1', description: 'General Consultation', quantity: 1, unitPriceCents: 15000, totalCents: 15000 },
      { id: 'li2', invoiceId: 'inv1', description: 'Blood Panel', quantity: 1, unitPriceCents: 8500, totalCents: 8500 },
    ],
    totalAmountCents: 23500, issuedAt: '2026-03-18', dueAt: '2026-04-01', paidAt: '2026-03-20',
  },
  {
    id: 'inv2', tenantId: 't1', invoiceNumber: 'INV-2026-003',
    patientId: 'me', patientName: 'John Doe',
    appointmentDate: '2026-03-10',
    status: 'overdue',
    lineItems: [
      { id: 'li3', invoiceId: 'inv2', description: 'Follow-up Consultation', quantity: 1, unitPriceCents: 12000, totalCents: 12000 },
    ],
    totalAmountCents: 12000, issuedAt: '2026-03-10', dueAt: '2026-03-17',
  },
  {
    id: 'inv3', tenantId: 't1', invoiceNumber: 'INV-2026-005',
    patientId: 'me', patientName: 'John Doe',
    appointmentDate: '2026-02-20',
    status: 'sent',
    lineItems: [
      { id: 'li4', invoiceId: 'inv3', description: 'Specialist Consultation', quantity: 1, unitPriceCents: 25000, totalCents: 25000 },
      { id: 'li5', invoiceId: 'inv3', description: 'ECG Test', quantity: 1, unitPriceCents: 5000, totalCents: 5000 },
    ],
    totalAmountCents: 30000, issuedAt: '2026-02-20', dueAt: '2026-03-06',
  },
  {
    id: 'inv4', tenantId: 't1', invoiceNumber: 'INV-2026-007',
    patientId: 'me', patientName: 'John Doe',
    appointmentDate: '2026-01-15',
    status: 'paid',
    lineItems: [
      { id: 'li6', invoiceId: 'inv4', description: 'New Patient Consultation', quantity: 1, unitPriceCents: 18000, totalCents: 18000 },
    ],
    totalAmountCents: 18000, issuedAt: '2026-01-15', dueAt: '2026-01-29', paidAt: '2026-01-28',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function statusVariant(s: InvoiceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'paid')    return 'default'
  if (s === 'sent')    return 'secondary'
  if (s === 'overdue') return 'destructive'
  return 'outline'
}

function statusLabel(s: InvoiceStatus): string {
  if (s === 'paid')    return 'Paid'
  if (s === 'sent')    return 'Awaiting Payment'
  if (s === 'overdue') return 'Overdue'
  return 'Draft'
}

// ── Invoice Card ───────────────────────────────────────────────────────────────

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false)
  const isUnpaid = invoice.status === 'sent' || invoice.status === 'overdue'

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Summary */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30 ${
          isUnpaid ? 'border-l-4 border-l-destructive/60' : ''
        }`}
        onClick={() => setExpanded(v => !v)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{invoice.invoiceNumber}</span>
            <Badge variant={statusVariant(invoice.status)} className="text-xs">
              {statusLabel(invoice.status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visit: {invoice.appointmentDate ?? '—'} · Due: {invoice.dueAt}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-bold">{centsToDisplay(invoice.totalAmountCents)}</span>
          <span className="text-muted-foreground text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Line items breakdown */}
      {expanded && (
        <div className="border-t bg-muted/10 px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Breakdown</p>
          {invoice.lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No line items yet.</p>
          ) : (
            <div className="space-y-1">
              {invoice.lineItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {item.description}
                    {item.quantity > 1 && <span className="text-muted-foreground ml-1">× {item.quantity}</span>}
                  </span>
                  <span className="font-medium tabular-nums">{centsToDisplay(item.totalCents)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-semibold border-t pt-1 mt-1">
                <span>Total</span>
                <span>{centsToDisplay(invoice.totalAmountCents)}</span>
              </div>
            </div>
          )}
          {invoice.paidAt && (
            <p className="text-xs text-green-600 mt-1">✓ Paid on {invoice.paidAt}</p>
          )}
          {isUnpaid && (
            <p className="text-xs text-muted-foreground mt-1">
              To pay, please contact the clinic directly.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PortalInvoicesPage() {
  const invoices = MOCK_INVOICES

  const outstandingCents = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.totalAmountCents, 0)

  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Invoices</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{invoices.length} invoices total</p>
      </div>

      {/* Outstanding balance summary */}
      {outstandingCents > 0 && (
        <Card className={overdueCount > 0 ? 'border-destructive/40' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{centsToDisplay(outstandingCents)}</p>
            {overdueCount > 0 && (
              <p className="text-sm text-destructive mt-1">
                {overdueCount} invoice{overdueCount > 1 ? 's' : ''} overdue — please contact the clinic
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              To arrange payment, please contact your clinic directly.
            </p>
          </CardContent>
        </Card>
      )}

      {outstandingCents === 0 && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          ✓ No outstanding balance — all invoices are settled.
        </div>
      )}

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.map(inv => (
          <InvoiceCard key={inv.id} invoice={inv} />
        ))}
      </div>
    </div>
  )
}
