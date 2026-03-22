import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRow } from '@/components/ui/skeleton'
import api from '@/services/api'
import { toast } from 'sonner'

interface QueueItem {
  id: string
  patientName: string
  testName: string
  uploadDate: string
  fileType: 'PDF' | 'Image'
}

const CATEGORIES = ['All', 'Lab Result', 'Prescription', 'Referral', 'Other'] as const
type CategoryFilter = typeof CATEGORIES[number]

function guessFileType(url: string | null): 'PDF' | 'Image' {
  if (!url) return 'PDF'
  return url.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Image'
}

export function ReviewQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reviewConfirmId, setReviewConfirmId] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/review-queue', { params: { limit: 100 } })
      const mapped: QueueItem[] = (res.data.data as Record<string, unknown>[]).map(item => {
        const p = item.patient as { firstName: string; lastName: string } | undefined
        return {
          id:          String(item.id),
          patientName: p ? `${p.firstName} ${p.lastName}`.trim() : 'Unknown Patient',
          testName:    String(item.testName),
          uploadDate:  String(item.createdAt).substring(0, 10),
          fileType:    guessFileType(item.resultFileUrl as string | null),
        }
      })
      setItems(mapped)
    } catch {
      toast.error('Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const handleReviewed = async (id: string) => {
    try {
      await api.put(`/api/v1/review-queue/${id}/status`, { status: 'reviewed' })
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Marked as reviewed')
    } catch {
      toast.error('Failed to mark as reviewed')
    }
    setReviewConfirmId(null)
  }

  const handleReject = async (id: string) => {
    try {
      await api.put(`/api/v1/review-queue/${id}/status`, { status: 'rejected' })
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Rejected')
    } catch {
      toast.error('Failed to reject')
    }
    setRejectId(null)
    setRejectReason('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
        {!loading && <Badge variant="default">{items.length} pending</Badge>}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={categoryFilter === cat ? 'default' : 'outline'}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={CheckCircle}
          heading="Queue is clear"
          subtext="All documents have been reviewed."
        />
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                      {item.fileType === 'PDF' ? 'PDF' : 'IMG'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.patientName}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">{item.testName}</Badge>
                        <span className="text-xs text-muted-foreground">{item.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {reviewConfirmId === item.id ? (
                      <span className="flex gap-1 items-center text-xs">
                        <span>Confirm?</span>
                        <Button size="sm" onClick={() => handleReviewed(item.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setReviewConfirmId(null)}>No</Button>
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => setReviewConfirmId(item.id)}>
                        Mark Reviewed
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectId(item.id); setRejectReason('') }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {rejectId === item.id && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    <p className="text-sm font-medium">Rejection reason:</p>
                    <input
                      type="text"
                      className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!rejectReason.trim()}
                        onClick={() => handleReject(item.id)}
                      >
                        Submit Rejection
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
