export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <p className="text-2xl font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">This module is coming soon.</p>
    </div>
  )
}
