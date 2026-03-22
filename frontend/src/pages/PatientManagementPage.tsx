import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { SkeletonTableRow } from '@/components/ui/skeleton'
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
import { MoreHorizontal, Search, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PatientForm } from '@/components/patients/PatientForm'
import api from '@/services/api'
import type { Patient } from '@/types'

function toPatient(raw: Record<string, unknown>): Patient {
  return {
    ...(raw as unknown as Patient),
    fullName: `${raw.firstName} ${raw.lastName}`,
    dob: raw.dob ? String(raw.dob).substring(0, 10) : undefined,
  }
}

export function PatientManagementPage() {
  const navigate = useNavigate()

  const [patients,   setPatients]   = useState<Patient[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total,      setTotal]      = useState(0)
  const [formOpen,   setFormOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Patient | undefined>(undefined)

  const fetchPatients = useCallback(async (searchVal = search, pageVal = page) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page: pageVal, limit: 20 }
      if (searchVal.trim()) params.search = searchVal.trim()
      const res = await api.get('/api/v1/patients', { params })
      setPatients(res.data.data.map(toPatient))
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.pages)
    } catch {
      setError('Failed to load patients. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchPatients(search, page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchPatients(search, 1)
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openAdd  = () => { setEditTarget(undefined); setFormOpen(true) }
  const openEdit = (p: Patient) => { setEditTarget(p); setFormOpen(true) }

  const handleSave = async (patient: Patient) => {
    try {
      if (patient.id && patients.find(p => p.id === patient.id)) {
        await api.put(`/api/v1/patients/${patient.id}`, patient)
      } else {
        await api.post('/api/v1/patients', patient)
      }
      setFormOpen(false)
      fetchPatients(search, page)
    } catch {
      // PatientForm surfaces its own errors; just close on success
    }
  }

  const toggleActive = async (p: Patient) => {
    try {
      await api.put(`/api/v1/patients/${p.id}`, { isActive: !p.isActive })
      fetchPatients(search, page)
    } catch {
      setError('Failed to update patient status.')
    }
  }

  const activeCount = patients.filter(p => p.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Loading…' : `${activeCount} active · ${total} total`}
          </p>
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

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)}
              </tbody>
            </table>
          ) : patients.length === 0 ? (
            search ? (
              <EmptyState
                icon={Users}
                heading={`No patients match "${search}"`}
                subtext="Try a different name, phone number, or email."
              />
            ) : (
              <EmptyState
                icon={Users}
                heading="No patients yet"
                subtext="Add your first patient to get started."
                action={{ label: '+ Add Patient', onClick: openAdd }}
              />
            )
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
                  {patients.map(p => (
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
                            <DropdownMenuItem onClick={() => toggleActive(p)}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <PatientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialValues={editTarget}
      />
    </div>
  )
}
