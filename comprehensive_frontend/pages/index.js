import Head from 'next/head';
import Link from 'next/link';

import { useMarketPulse } from '../hooks/useMarketPulse';
import { getSignalBySymbol } from '../lib/premiumData';
import styles from '../styles/home-page.module.css';

function inferAction(signalLabel = '') {
  return /short|sell/i.test(signalLabel) ? 'SELL' : 'BUY';
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function HomePage() {
  const { signals, source, loading } = useMarketPulse();
  const featuredSignal =
    signals.find((signal) => signal.symbol === 'BTC') || signals[0] || getSignalBySymbol('BTC');

  const actionLabel = inferAction(featuredSignal.signal);
  const confidencePercent = Math.round(Number(featuredSignal.confidence || 0) * 100);
  const appHref = `/app?symbol=${featuredSignal.symbol}`;
  const explainerHref = `/ai-explainer?symbol=${featuredSignal.symbol}`;
  const liveBadge = loading ? 'SYNCING LIVE SIGNAL' : source ? source.toUpperCase() : 'LIVE AI SIGNAL';
  const featureCards = [
    {
      title: 'Inspect Signal',
      description: 'Open the reasoning layer behind the active setup, including drivers, indicators, and risk context.',
      href: explainerHref,
    },
    {
      title: 'Approve Execution',
      description: 'Review the active setup, size the order, and approve execution with transparent validation steps.',
      href: appHref,
    },
    {
      title: 'Review History',
      description: 'Check executed positions, recent activity, and confirmation references from one trading surface.',
      href: '/trade-history',
    },
  ];

  return (
    <>
      <Head>
        <title>AI Power Trade</title>
      </Head>

      <div className={cx('apt-shell', styles.page)}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>APT</span>
              <span>AI POWER TRADE</span>
            </Link>

            <div className={styles.navGroup}>
              <div className={styles.navLinks}>
                <Link href={appHref} className={styles.navLink}>
                  App
                </Link>
                <Link href={explainerHref} className={styles.navLink}>
                  AI Explainer
                </Link>
                <Link href="/trade-history" className={styles.navLink}>
                  Trade History
                </Link>
              </div>
              <Link href={appHref} className={styles.launchButton}>
                Launch App
              </Link>
            </div>
          </nav>

          <section className={styles.hero}>
            <div className={styles.heroEyebrow}>AI Assisted Execution</div>
            <h1>AI Trading Without Complexity</h1>
            <p>
              Inspect the setup, approve the execution, and review the history from one focused trading
              surface.
            </p>

            <div className={styles.cta}>
              <Link href={appHref} className={cx(styles.ctaButton, styles.primaryButton)}>
                Start Trading
              </Link>
              <Link href={explainerHref} className={cx(styles.ctaButton, styles.secondaryButton)}>
                Open AI Explainer
              </Link>
            </div>
          </section>

          <section className={styles.aiPreview}>
            <div className={styles.previewCopy}>
              <div className={styles.previewBadge}>{liveBadge}</div>
              <h2>
                {actionLabel} {featuredSignal.symbol} · {confidencePercent}% Confidence
              </h2>
              <p>
                AI combines signal models, market structure context, and live market tape to surface
                clearer setups that are ready for review.
              </p>

              <div className={styles.previewMeta}>
                <span>Entry {featuredSignal.entryZone}</span>
                <span>Target {featuredSignal.targetZone}</span>
              </div>

              <div className={styles.previewActions}>
                <Link href={explainerHref} className={styles.previewPrimaryLink}>
                  Read AI Explainer
                </Link>
                <Link href={appHref} className={styles.previewSecondaryLink}>
                  Open App
                </Link>
              </div>
            </div>

            <div
              className={styles.ring}
              style={{
                background: `conic-gradient(var(--home-green) 0 ${confidencePercent}%, rgba(42, 57, 82, 0.95) ${confidencePercent}% 100%)`,
              }}
            >
              <div className={styles.ringInner}>
                <b>{confidencePercent}%</b>
                <span>AI</span>
              </div>
            </div>
          </section>

          <section className={styles.features}>
            {featureCards.map((feature) => (
              <Link href={feature.href} key={feature.title} className={styles.card}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className={styles.cardLink}>Open page</span>
              </Link>
            ))}
          </section>

          <section className={styles.final}>
            <p>
              Open the workspace, inspect the active signal, and move straight into approval from one
              place.
            </p>
            <Link href={appHref} className={styles.finalButton}>
              Launch Execution Workspace
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
