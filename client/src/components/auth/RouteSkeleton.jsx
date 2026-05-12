export function RouteSkeleton() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-gray-950 px-4">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-white/10" />
      <div className="h-4 w-48 animate-pulse rounded-md bg-white/10" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-white/5" />
    </div>
  )
}
