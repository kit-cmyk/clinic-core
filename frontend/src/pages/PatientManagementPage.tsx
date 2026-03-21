import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search } from 'lucide-react'
import { PatientForm, MOCK_PATIENTS } from '@/components/patients/PatientForm'
import type { Patient } from '@/types'

export function PatientManagementPage() {
  const navigate = useNavigate()
  const [patients,    setPatients]    = useState<Patient[]>(MOCK_PATIENTS)
  const [search,      setSearch]      = useState('')
  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<Patient | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return patients
    return patients.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      (p.phone ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q),
    )
  }, [patients, search])

  const openAdd = () => { setEditTarget(undefined); setFormOpen(true) }

  const openEdit = (p: Patient) => { setEditTarget(p); setFormOpen(true) }

  const handleSave = (patient: Patient) => {
    setPatients(prev => {
      const idx = prev.findIndex(p => p.id === patient.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = patient
        return updated
      }
      return [...prev, patient]
    })
    setFormOpen(false)
  }

  const toggleActive = (id: string) =>
    setPatients(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))

  const activeCount = patients.filter(p => p.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activeCount} active · {patients.length} total</p>
        </div>
        <Button size="sm" onClick={openAdd}>+ Add Patient</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 text-sm h-9"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search patients"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {search ? `No patients match "${search}"` : 'No patients yet. Click "Add Patient" to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-medium text-muted-foreground">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">DOB</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Email</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}/chart`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-primary">
                              {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.dob ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.isActive ? 'default' : 'secondary'}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/patients/${p.id}/chart`}>View Chart</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleActive(p.id)}>
                              {p.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PatientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialValues={editTarget}
      />
    </div>
  )
}
