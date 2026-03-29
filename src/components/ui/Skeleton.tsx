export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function GalleryCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Skeleton className="mb-3 aspect-video rounded-md" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-1 h-4 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export function ThumbnailSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-1.5">
      <Skeleton className="aspect-square rounded-md" />
      <div className="mt-1.5 px-0.5">
        <Skeleton className="mb-1 h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
