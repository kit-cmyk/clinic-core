import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

type Category = 'Lab Result' | 'Prescription' | 'Referral' | 'Other'

interface QueueItem {
  id: string
  patientName: string
  category: Category
  uploadDate: string
  fileType: 'PDF' | 'Image'
}

const MOCK_QUEUE: QueueItem[] = [
  { id: '1', patientName: 'John Doe', category: 'Lab Result', uploadDate: '2026-03-15', fileType: 'PDF' },
  { id: '2', patientName: 'Jane Smith', category: 'Prescription', uploadDate: '2026-03-16', fileType: 'Image' },
  { id: '3', patientName: 'Carlos Rivera', category: 'Referral', uploadDate: '2026-03-17', fileType: 'PDF' },
  { id: '4', patientName: 'Priya Patel', category: 'Other', uploadDate: '2026-03-18', fileType: 'Image' },
]

const CATEGORIES: Array<'All' | Category> = ['All', 'Lab Result', 'Prescription', 'Referral', 'Other']

export function ReviewQueuePage() {
  const [items, setItems] = useState<QueueItem[]>(MOCK_QUEUE)
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reviewConfirmId, setReviewConfirmId] = useState<string | null>(null)

  const filtered = items.filter(
    (i) => categoryFilter === 'All' || i.category === categoryFilter,
  )

  const handleReviewed = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setReviewConfirmId(null)
  }

  const handleReject = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setRejectId(null)
    setRejectReason('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
        <Badge variant="default">{items.length} pending</Badge>
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

      {/* Queue items */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold text-foreground">Queue is clear</p>
          <p className="text-sm text-muted-foreground">All documents have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex gap-4 items-center">
                    {/* Preview thumbnail placeholder */}
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                      {item.fileType === 'PDF' ? 'PDF' : 'IMG'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.patientName}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">{item.category}</Badge>
                        <span className="text-xs text-muted-foreground">{item.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {/* Mark Reviewed */}
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

                    {/* Reject */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectId(item.id); setRejectReason('') }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {/* Reject reason input */}
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
