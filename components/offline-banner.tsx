interface OfflineBannerProps {
  lastUpdated?: string;
}

export function OfflineBanner({ lastUpdated }: OfflineBannerProps): JSX.Element {
  return (
    <section className="offline-banner" role="status">
      <p>
        Offline mode: showing cached forecast.
        {lastUpdated ? ` Last updated ${new Date(lastUpdated).toLocaleString()}.` : ''}
      </p>
    </section>
  );
}
