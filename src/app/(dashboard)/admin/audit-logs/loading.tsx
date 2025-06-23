export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded-md"></div>
      <div className="h-6 w-1/2 bg-muted rounded-md"></div>
      <div className="h-12 w-full bg-muted rounded-md mt-4"></div> {}
      <div className="h-64 w-full bg-muted rounded-md mt-6"></div> {}
    </div>
  );
}
