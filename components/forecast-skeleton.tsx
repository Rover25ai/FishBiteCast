export function ForecastSkeleton(): JSX.Element {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading forecast">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card skeleton-block" />
      ))}
    </section>
  );
}
