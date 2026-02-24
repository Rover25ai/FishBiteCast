'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }): JSX.Element {
  return (
    <html>
      <body>
        <section className="page-shell">
          <article className="card error-card">
            <h2 className="section-title">Unexpected app error</h2>
            <p className="helper-text">Something failed while rendering this page.</p>
            <button type="button" className="button-primary" onClick={reset}>
              Try again
            </button>
          </article>
        </section>
      </body>
    </html>
  );
}
