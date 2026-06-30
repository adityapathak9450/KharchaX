export function RouteSkeleton() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-canvas px-4">
      <div className="h-10 w-10 skeleton rounded-xl" />
      <div className="h-4 w-48 skeleton rounded-md" />
      <div className="h-4 w-64 skeleton rounded-md" />
    </div>
  )
}
