import Image from 'next/image';

export function HeroBanner(): JSX.Element {
  return (
    <section className="card hero-banner">
      <div className="hero-copy">
        <p className="hero-kicker">Field-Tested Forecasting</p>
        <h2 className="hero-title">Plan around the bite, not around guesswork.</h2>
        <p className="hero-text">
          fishbitecast.com combines weather, pressure trend, moon phase, and solunar windows to help you hit the most
          productive freshwater windows.
        </p>
      </div>

      <div className="hero-figure-wrap">
        <div className="hero-figure-glow" />
        <Image
          src="/images/angler-hero.png"
          alt="Angler holding a freshwater bass"
          width={578}
          height={640}
          priority
          className="hero-figure"
        />
      </div>
    </section>
  );
}
