export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }): JSX.Element {
  return (
    <section className="card error-card" role="status">
      <h2 className="section-title">Could not update forecast</h2>
      <p className="helper-text">{message}</p>
      <button type="button" className="button-primary" onClick={onRetry}>
        Retry
      </button>
    </section>
  );
}
