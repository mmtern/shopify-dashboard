import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-6 w-10" />
          </div>
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
      </div>

      <div className="w-full bg-card rounded-md border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="p-0">
          <div className="border-b border-border px-4 py-3 flex gap-4">
            <Skeleton className="h-6 w-full" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-border px-4 py-4 flex gap-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
