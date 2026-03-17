import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const CATEGORIES = ['Lab Result', 'Prescription', 'Referral Letter', 'Other'] as const
type Category = typeof CATEGORIES[number]

export function PortalUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<Category | ''>('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)

  // Animate progress bar when uploading
  useEffect(() => {
    if (!uploading) return
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setUploading(false)
          setSuccess(true)
          return 100
        }
        return p + 10
      })
    }, 80)
    return () => clearInterval(interval)
  }, [uploading])

  const canUpload = !!file && !!category

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpload) return
    setUploading(true)
  }

  const handleReset = () => {
    setFile(null)
    setCategory('')
    setDescription('')
    setProgress(0)
    setSuccess(false)
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Upload Document</h1>
      <Card>
        <CardContent className="pt-6">
          {success ? (
            <div className="space-y-4 text-center py-4">
              <p className="text-green-600 font-medium">
                Document uploaded. Pending clinic review.
              </p>
              <Button variant="outline" onClick={handleReset}>
                Upload another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* File picker */}
              <div className="space-y-2">
                <Label>File</Label>
                <label
                  htmlFor="upload-file"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">
                    Click to select or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">.pdf, .jpg, .jpeg, .png</p>
                  <input
                    id="upload-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {file && (
                  <p className="text-sm text-foreground">
                    Selected: <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | '')}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full resize-none"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note (max 500 characters)"
                />
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Uploading…</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-75"
                      style={{ width: `${progress}%` }}
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={!canUpload || uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
