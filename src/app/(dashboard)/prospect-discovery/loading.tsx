export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 w-1/3 bg-muted rounded-md"></div>
      <div className="h-12 w-full bg-muted rounded-md"></div>
      <div className="h-64 w-full bg-muted rounded-md"></div>
    </div>
  );
}
