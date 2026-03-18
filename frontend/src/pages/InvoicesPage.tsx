import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@/types'

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1', tenantId: 't1', invoiceNumber: 'INV-2026-001',
    patientId: 'p1', patientName: 'John Doe',
    appointmentId: 'a10', appointmentDate: '2026-03-18',
    status: 'paid',
    lineItems: [
      { id: 'li1', invoiceId: 'inv1', description: 'General Consultation', quantity: 1, unitPriceCents: 15000, totalCents: 15000 },
      { id: 'li2', invoiceId: 'inv1', description: 'Blood Panel', quantity: 1, unitPriceCents: 8500, totalCents: 8500 },
    ],
    totalAmountCents: 23500, issuedAt: '2026-03-18', dueAt: '2026-04-01', paidAt: '2026-03-20',
  },
  {
    id: 'inv2', tenantId: 't1', invoiceNumber: 'INV-2026-002',
    patientId: 'p2', patientName: 'Maria Chen',
    appointmentId: 'a11', appointmentDate: '2026-03-18',
    status: 'sent',
    lineItems: [
      { id: 'li3', invoiceId: 'inv2', description: 'Cardiology Consultation', quantity: 1, unitPriceCents: 25000, totalCents: 25000 },
      { id: 'li4', invoiceId: 'inv2', description: 'ECG Test', quantity: 1, unitPriceCents: 5000, totalCents: 5000 },
    ],
    totalAmountCents: 30000, issuedAt: '2026-03-18', dueAt: '2026-04-01',
  },
  {
    id: 'inv3', tenantId: 't1', invoiceNumber: 'INV-2026-003',
    patientId: 'p3', patientName: 'Carlos Rivera',
    appointmentDate: '2026-03-17',
    status: 'overdue',
    lineItems: [
      { id: 'li5', invoiceId: 'inv3', description: 'New Patient Consultation', quantity: 1, unitPriceCents: 18000, totalCents: 18000 },
      { id: 'li6', invoiceId: 'inv3', description: 'X-Ray', quantity: 2, unitPriceCents: 6000, totalCents: 12000 },
    ],
    totalAmountCents: 30000, issuedAt: '2026-03-10', dueAt: '2026-03-17',
  },
  {
    id: 'inv4', tenantId: 't1', invoiceNumber: 'INV-2026-004',
    patientId: 'p4', patientName: 'Priya Sharma',
    appointmentDate: '2026-03-18',
    status: 'draft',
    lineItems: [
      { id: 'li7', invoiceId: 'inv4', description: 'Follow-up Consultation', quantity: 1, unitPriceCents: 12000, totalCents: 12000 },
    ],
    totalAmountCents: 12000, issuedAt: '2026-03-18', dueAt: '2026-04-02',
  },
  {
    id: 'inv5', tenantId: 't1', invoiceNumber: 'INV-2026-005',
    patientId: 'p5', patientName: 'Tom Wilson',
    appointmentDate: '2026-03-16',
    status: 'paid',
    lineItems: [
      { id: 'li8', invoiceId: 'inv5', description: 'Dermatology Consultation', quantity: 1, unitPriceCents: 20000, totalCents: 20000 },
    ],
    totalAmountCents: 20000, issuedAt: '2026-03-16', dueAt: '2026-03-30', paidAt: '2026-03-22',
  },
  {
    id: 'inv6', tenantId: 't1', invoiceNumber: 'INV-2026-006',
    patientId: 'p6', patientName: 'Aisha Patel',
    appointmentDate: '2026-03-18',
    status: 'draft',
    lineItems: [],
    totalAmountCents: 0, issuedAt: '2026-03-18', dueAt: '2026-04-02',
  },
]

const MOCK_PATIENTS = [
  { id: 'p1', name: 'John Doe' }, { id: 'p2', name: 'Maria Chen' },
  { id: 'p3', name: 'Carlos Rivera' }, { id: 'p4', name: 'Priya Sharma' },
  { id: 'p5', name: 'Tom Wilson' }, { id: 'p6', name: 'Aisha Patel' },
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

// ── Line Item Editor ───────────────────────────────────────────────────────────

function LineItemEditor({
  invoiceId,
  items,
  onChange,
}: {
  invoiceId: string
  items: InvoiceLineItem[]
  onChange: (items: InvoiceLineItem[]) => void
}) {
  const add = () => {
    onChange([...items, { id: `li-${Date.now()}`, invoiceId, description: '', quantity: 1, unitPriceCents: 0, totalCents: 0 }])
  }
  const remove = (id: string) => onChange(items.filter(i => i.id !== id))
  const update = (id: string, field: Partial<InvoiceLineItem>) => {
    onChange(items.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, ...field }
      updated.totalCents = updated.quantity * updated.unitPriceCents
      return updated
    }))
  }

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_5rem_7rem_7rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span>Description</span><span>Qty</span><span>Unit Price</span><span>Total</span><span />
          </div>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[1fr_5rem_7rem_7rem_2rem] gap-2 items-center">
              <Input value={item.description} onChange={e => update(item.id, { description: e.target.value })} placeholder="Item description" className="h-7 text-sm" aria-label="Line item description" />
              <Input type="number" min={1} value={item.quantity} onChange={e => update(item.id, { quantity: Math.max(1, Number(e.target.value)) })} className="h-7 text-sm" aria-label="Quantity" />
              <Input type="number" min={0} step={0.01} value={(item.unitPriceCents / 100).toFixed(2)} onChange={e => update(item.id, { unitPriceCents: Math.round(parseFloat(e.target.value || '0') * 100) })} className="h-7 text-sm" aria-label="Unit price" />
              <span className="text-sm font-medium text-right pr-1">{centsToDisplay(item.totalCents)}</span>
              <button onClick={() => remove(item.id)} className="text-destructive text-sm hover:opacity-70" aria-label="Remove line item">✕</button>
            </div>
          ))}
        </div>
      )}
      <Button size="sm" variant="outline" onClick={add}>+ Add Line Item</Button>
    </div>
  )
}

// ── Invoice Row (expandable) ───────────────────────────────────────────────────

function InvoiceRow({
  invoice,
  expanded,
  onExpand,
  onUpdateItems,
  onSend,
  onMarkPaid,
}: {
  invoice: Invoice
  expanded: boolean
  onExpand: () => void
  onUpdateItems: (items: InvoiceLineItem[]) => void
  onSend: () => void
  onMarkPaid: () => void
}) {
  return (
    <div className="border-b last:border-0">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onExpand}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex-1 grid grid-cols-[8rem_1fr_8rem_7rem_7rem] gap-4 items-center min-w-0">
          <span className="font-mono text-xs text-muted-foreground">{invoice.invoiceNumber}</span>
          <span className="text-sm font-medium">{invoice.patientName}</span>
          <span className="text-xs text-muted-foreground">{invoice.appointmentDate ?? '—'}</span>
          <span className="text-sm font-semibold">{centsToDisplay(invoice.totalAmountCents)}</span>
          <Badge variant={statusVariant(invoice.status)} className="capitalize w-fit">{invoice.status}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.status === 'draft' && (
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onSend() }}>Send Invoice</DropdownMenuItem>
              )}
              {invoice.status === 'sent' && (
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onMarkPaid() }}>Mark as Paid</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onExpand() }}>
                {expanded ? 'Collapse' : 'View Details'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-muted-foreground text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/10 space-y-4">
          <div className="flex items-center justify-between pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Line Items</p>
            <p className="text-sm font-semibold">Total: {centsToDisplay(invoice.totalAmountCents)}</p>
          </div>
          <LineItemEditor invoiceId={invoice.id} items={invoice.lineItems} onChange={onUpdateItems} />
          {invoice.paidAt && <p className="text-xs text-green-600">Paid on {invoice.paidAt}</p>}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Issued: {invoice.issuedAt} · Due: {invoice.dueAt}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

type FilterTab = 'all' | InvoiceStatus

export function InvoicesPage() {
  const [invoices,   setInvoices]   = useState<Invoice[]>(MOCK_INVOICES)
  const [filterTab,  setFilterTab]  = useState<FilterTab>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sheetOpen,  setSheetOpen]  = useState(false)

  // Create form
  const [patientId, setPatientId] = useState(MOCK_PATIENTS[0].id)
  const [dueDate,   setDueDate]   = useState('')

  const filtered = useMemo(() =>
    filterTab === 'all' ? invoices : invoices.filter(i => i.status === filterTab),
    [invoices, filterTab]
  )

  const totalOutstanding = useMemo(() =>
    invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.totalAmountCents, 0),
    [invoices]
  )

  const handleCreate = () => {
    const patient = MOCK_PATIENTS.find(p => p.id === patientId)!
    const today = new Date().toISOString().slice(0, 10)
    const inv: Invoice = {
      id:               `inv-${Date.now()}`,
      tenantId:         't1',
      invoiceNumber:    `INV-2026-${String(Date.now()).slice(-3)}`,
      patientId:        patient.id,
      patientName:      patient.name,
      status:           'draft',
      lineItems:        [],
      totalAmountCents: 0,
      issuedAt:         today,
      dueAt:            dueDate || today,
    }
    setInvoices(prev => [inv, ...prev])
    setSheetOpen(false)
    setPatientId(MOCK_PATIENTS[0].id)
    setDueDate('')
  }

  const updateItems = (id: string, items: InvoiceLineItem[]) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv
      return { ...inv, lineItems: items, totalAmountCents: items.reduce((s, li) => s + li.totalCents, 0) }
    }))
  }

  const sendInvoice = (id: string) =>
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'sent' } : i))

  const markPaid = (id: string) => {
    const today = new Date().toISOString().slice(0, 10)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid', paidAt: today } : i))
  }

  const STATUS_TABS: FilterTab[] = ['all', 'draft', 'sent', 'paid', 'overdue']
  const counts = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Outstanding: <span className="font-semibold text-foreground">{centsToDisplay(totalOutstanding)}</span>
            {' '}· {invoices.length} invoices
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>+ New Invoice</Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              filterTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Invoice list */}
      <Card>
        <CardContent className="p-0">
          <div className="hidden md:grid grid-cols-[8rem_1fr_8rem_7rem_7rem_10rem] gap-4 px-4 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
            <span>Invoice #</span><span>Patient</span><span>Appt Date</span><span>Total</span><span>Status</span><span>Actions</span>
          </div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No {filterTab === 'all' ? '' : filterTab} invoices.</p>
          ) : (
            filtered.map(inv => (
              <InvoiceRow
                key={inv.id}
                invoice={inv}
                expanded={expandedId === inv.id}
                onExpand={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                onUpdateItems={items => updateItems(inv.id, items)}
                onSend={() => sendInvoice(inv.id)}
                onMarkPaid={() => markPaid(inv.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New Invoice</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Patient</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                aria-label="Select patient"
              >
                {MOCK_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} aria-label="Due date" />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate}>Create Invoice</Button>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
