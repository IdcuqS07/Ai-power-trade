import { useState, useEffect } from 'react';
import styles from '../styles/ai-power-trade-workspace.module.css';

const API_BASE = '/api/app/sosovalue/research-context';

async function fetchResearchContext(symbol, newsLimit = 5) {
  const url = `${API_BASE}/${encodeURIComponent(symbol)}?news_limit=${newsLimit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function getFreshness(updatedAt) {
  if (!updatedAt) return { label: 'STALE', variant: 'stale' };

  const deltaMinutes = (Date.now() - new Date(updatedAt).getTime()) / 60000;

  if (deltaMinutes < 5) return { label: 'LIVE', variant: 'live' };
  if (deltaMinutes < 30) return { label: 'DELAYED', variant: 'delayed' };
  return { label: 'STALE', variant: 'stale' };
}

function classes(...names) {
  return names.filter(Boolean).join(' ');
}

function getSignalType(signal) {
  return signal?.signal_type || signal?.type || signal?.signal || 'HOLD';
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'Awaiting update';
  }

  const value = new Date(timestamp).getTime();

  if (!Number.isFinite(value)) {
    return 'Awaiting update';
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));

  if (deltaSeconds < 60) {
    return 'just now';
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  return `${Math.floor(deltaHours / 24)}d ago`;
}

function normalizeLabel(value, fallback = '--') {
  const normalized = String(value || '')
    .trim()
    .replace(/_/g, ' ');

  return normalized ? normalized.toUpperCase() : fallback;
}

function getToneClass(value, variant = 'default') {
  const normalized = normalizeLabel(value, '').toUpperCase();

  if (/BULL|RISK-ON|POSITIVE/.test(normalized)) {
    return styles['sov-tone-bull'];
  }

  if (/DEFENSIVE|RISK-OFF|BEAR/.test(normalized)) {
    return styles['sov-tone-bear'];
  }

  if (/CAUT|NEUTRAL|BUILDING/.test(normalized)) {
    return variant === 'narrative' ? styles['sov-tone-yellow'] : styles['sov-tone-cyan'];
  }

  if (/EXPANDING|STRONG/.test(normalized)) {
    return styles['sov-tone-cyan'];
  }

  return styles['sov-tone-cyan'];
}

function buildMetricRows(research) {
  // Map backend fields: catalyst_score, catalyst_label, sentiment, macro_context
  const catalystScore = Number(research?.catalyst_score || research?.catalystScore);
  const sentimentScore = Number(research?.sentiment?.score);
  const newsCount = Number(research?.news_count || research?.headlineCount || 0);
  const macroRegime = research?.macro_context?.overall_regime || research?.marketRegime;

  // Derive narrative strength from catalyst label
  const catalystLabel = normalizeLabel(research?.catalyst_label || research?.catalystScore);
  let narrativeStrength = 'NEUTRAL';
  if (catalystLabel === 'HIGH') narrativeStrength = 'STRONG';
  else if (catalystLabel === 'MEDIUM') narrativeStrength = 'BUILDING';
  else narrativeStrength = 'WEAK';

  return [
    {
      label: 'Catalyst Score',
      value: Number.isFinite(catalystScore) ? `${Math.round(catalystScore)}/100` : '--',
      note: 'AI-generated catalyst strength',
      toneClass:
        Number.isFinite(catalystScore) && catalystScore >= 70
          ? styles['sov-tone-bull']
          : Number.isFinite(catalystScore) && catalystScore >= 45
            ? styles['sov-tone-yellow']
            : styles['sov-tone-bear'],
    },
    {
      label: 'Market Regime',
      value: normalizeLabel(macroRegime),
      note: 'Macro state for current tape',
      toneClass: getToneClass(macroRegime),
    },
    {
      label: 'Headlines',
      value: newsCount ? `${newsCount}` : '--',
      note: newsCount ? 'Active catalysts in feed' : 'Waiting for live headlines',
      toneClass: styles['sov-tone-cyan'],
    },
    {
      label: 'Narrative Strength',
      value: normalizeLabel(narrativeStrength),
      note: 'Narrative engine signal strength',
      toneClass: getToneClass(narrativeStrength, 'narrative'),
    },
    {
      label: 'Sentiment',
      value: normalizeLabel(research?.sentiment?.label),
      note: Number.isFinite(sentimentScore) ? `${Math.round(sentimentScore)}/100 live tone` : 'Market and community tone',
      toneClass: getToneClass(research?.sentiment?.label),
    },
  ];
}

const SosoValueCard = ({ symbol = 'BTC', className = '' }) => {
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [freshness, setFreshness] = useState({ label: 'STALE', variant: 'stale' });

  const loadResearch = async (currentSymbol) => {
    try {
      setError(null);
      const data = await fetchResearchContext(currentSymbol);

      if (data?.success && data?.data) {
        setResearch(data.data);
        setFreshness(getFreshness(data.data.timestamp || data.data.updatedAt));
      } else {
        throw new Error(data?.error || 'No data returned');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    loadResearch(symbol);

    const interval = setInterval(() => {
      loadResearch(symbol);
    }, 60000);

    return () => clearInterval(interval);
  }, [symbol]);

  const hasResearch = Boolean(research);
  const metrics = buildMetricRows(research);
  // Map backend latest_news to items
  const items = Array.isArray(research?.latest_news) ? research.latest_news.slice(0, 4) :
                Array.isArray(research?.items) ? research.items.slice(0, 4) : [];
  // Map backend timestamp
  const updatedAt = research?.timestamp || research?.updatedAt;
  const updatedLabel = hasResearch
    ? `Data updated ${formatRelativeTime(updatedAt)}`
    : loading
      ? 'Syncing live research context...'
      : 'Live research context unavailable';
  // Use rationale[0] as summary if available
  const summary =
    (Array.isArray(research?.rationale) && research.rationale[0]) ||
    research?.summary ||
    `The live SoSoValue research overlay has not returned narrative context for ${symbol} yet.`;
  const statusLabel = freshness.label;
  const statusVariant = freshness.variant;

  const statusBadgeClass = {
    live: styles['sov-status-live'],
    delayed: styles['sov-status-delayed'],
    stale: styles['sov-status-stale'],
    syncing: styles['sov-status-syncing'],
  }[statusVariant] || styles['sov-status-stale'];

  // Use catalyst_label as confidence fallback
  const footerConfidence = research?.catalyst_label || research?.confidence || 'Standby';
  const footerSource = 'SoSoValue overlay';
  const footerUpdated = hasResearch ? formatRelativeTime(updatedAt) : 'Awaiting live data';

  if (error && !loading && !hasResearch) {
    return (
      <section className={classes(styles['sov-card'], styles['sov-error-state'], className)}>
        <div className={styles['sov-header']}>
          <div className={styles['sov-title-block']}>
            <div className={styles['sov-eyebrow']}>
              SOSOVALUE <span className={styles['sov-logo-accent']}>RESEARCH</span>
            </div>
            <div className={styles['sov-subtitle']}>
              Catalyst context for <strong>{symbol}</strong>
            </div>
          </div>
          <div className={classes(styles['sov-status-badge'], styles['sov-status-error'])}>
            <span>OFFLINE</span>
          </div>
        </div>
        <div className={styles['sov-error-message']}>
          Unable to fetch live research data. {error}
        </div>
        <button
          className={styles['sov-retry-button']}
          onClick={() => {
            setLoading(true);
            loadResearch(symbol);
          }}
        >
          Retry Connection
        </button>
      </section>
    );
  }

  return (
    <section className={classes(styles['sov-card'], className)}>
      <div className={styles['sov-header']}>
        <div className={styles['sov-title-block']}>
          <div className={styles['sov-eyebrow']}>
            SOSOVALUE <span className={styles['sov-logo-accent']}>RESEARCH</span>
          </div>
          <div className={styles['sov-subtitle']}>
            Catalyst context for <strong>{symbol}</strong>
          </div>
        </div>
        <div className={classes(styles['sov-status-badge'], statusBadgeClass)}>
          {statusVariant !== 'syncing' && <span className={styles['sov-pulse']} />}
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className={styles['sov-updated-row']}>{updatedLabel}</div>

      {loading && !hasResearch ? (
        <div className={styles['sov-loading-grid']}>
          <div className={styles['sov-skeleton-card']} />
          <div className={styles['sov-skeleton-card']} />
          <div className={styles['sov-skeleton-card']} />
          <div className={styles['sov-skeleton-card']} />
          <div className={styles['sov-skeleton-card']} />
        </div>
      ) : (
        <div className={styles['sov-metrics-grid']}>
          {metrics.map((item) => (
            <article key={item.label} className={styles['sov-metric-card']}>
              <div className={styles['sov-metric-label']}>{item.label}</div>
              <div className={classes(styles['sov-metric-value'], item.toneClass)}>{item.value}</div>
              <div className={styles['sov-metric-note']}>{item.note}</div>
            </article>
          ))}
        </div>
      )}

      <div className={styles['sov-summary-card']}>
        <div className={styles['sov-summary-label']}>AI Narrative Intelligence</div>
        <div className={styles['sov-summary-text']}>{summary}</div>
      </div>

      <div className={styles['sov-feed-card']}>
        <div className={styles['sov-feed-header']}>
          <div className={styles['sov-feed-title']}>Latest Research &amp; Catalysts</div>
          <div className={styles['sov-feed-count']}>
            {hasResearch ? `${Number(research?.headlineCount || items.length || 0)} live` : 'Standby'}
          </div>
        </div>

        {items.length ? (
          <div className={styles['sov-feed-list']}>
            {items.map((item, index) => (
              <article key={`${item.title || 'research'}-${index}`} className={styles['sov-feed-item']}>
                <div className={styles['sov-feed-meta']}>
                  <span className={styles['sov-feed-type']}>{normalizeLabel(item.category || item.type, 'NEWS')}</span>
                  <span className={styles['sov-feed-time']}>{formatRelativeTime(item.published_at || item.publishedAt)}</span>
                </div>
                <div className={styles['sov-feed-item-title']}>{item.title}</div>
                <div className={styles['sov-feed-item-footer']}>
                  <span className={classes(styles['sov-feed-sentiment'], getToneClass(item.sentiment))}>
                    {normalizeLabel(item.sentiment, 'NEUTRAL')}
                  </span>
                  <span className={styles['sov-feed-score']}>
                    {Number.isFinite(Number(item.importance_score || item.score)) ? `${Math.round(Number(item.importance_score || item.score))}/100` : '--'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles['sov-empty-state']}>
            Live research headlines for {symbol} will appear here when the SoSoValue overlay returns catalyst items.
          </div>
        )}
      </div>

      <div className={styles['sov-footer']}>
        <span className={styles['sov-footer-pill']}>Last updated: {footerUpdated}</span>
        <span className={styles['sov-footer-pill']}>Source: {footerSource}</span>
        <span className={styles['sov-footer-pill']}>Confidence: {footerConfidence}</span>
      </div>
    </section>
  );
};

export default SosoValueCard;
