export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8" aria-busy="true" aria-label="Carregando">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-white" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 rounded-lg border bg-white" />
          <div className="h-64 rounded-lg border bg-white" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-8" aria-busy="true" aria-label="Carregando">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg border bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-8" aria-busy="true" aria-label="Carregando">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border bg-white" />
          ))}
        </div>
        <div className="h-64 rounded-lg border bg-white" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex-1 overflow-hidden p-4 lg:p-6" aria-busy="true" aria-label="Carregando">
      <div className="flex gap-4 h-full animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-80 shrink-0 space-y-3 rounded-lg border bg-white p-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="flex-1 overflow-hidden p-4 lg:p-6" aria-busy="true" aria-label="Carregando">
      <div className="h-full rounded-lg border bg-white animate-pulse">
        <div className="h-16 border-b bg-muted/40" />
        <div className="space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted" style={{ width: `${40 + (i % 4) * 12}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6" aria-busy="true" aria-label="Carregando">
      <div className="space-y-4 animate-pulse">
        <div className="h-16 rounded-lg border bg-white" />
        <div className="h-[28rem] rounded-lg border bg-white" />
      </div>
    </div>
  );
}
