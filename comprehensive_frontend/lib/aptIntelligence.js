import { AI_TIERS, SIGNAL_TYPES, TIER_PROGRESSION } from './enums';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function resolveSignalType(payload = {}) {
  const rawValue =
    payload?.signal_type ||
    payload?.type ||
    payload?.trade_type ||
    payload?.signal ||
    '';

  if (/sell|short/i.test(rawValue)) {
    return SIGNAL_TYPES.SELL;
  }

  if (/hold|watch/i.test(rawValue)) {
    return SIGNAL_TYPES.HOLD;
  }

  return SIGNAL_TYPES.BUY;
}

export function resolveAiTier(score) {
  if (score >= 85) {
    return AI_TIERS.EXTREME;
  }

  if (score >= 70) {
    return AI_TIERS.STRONG;
  }

  if (score >= 50) {
    return AI_TIERS.MODERATE;
  }

  return AI_TIERS.WEAK;
}

export function resolveTierProgression(score) {
  if (score >= 90) {
    return {
      key: TIER_PROGRESSION.ARCHITECT,
      label: 'Architect',
      minScore: 90,
      summary: 'System-level alignment with room for assertive execution.',
    };
  }

  if (score >= 80) {
    return {
      key: TIER_PROGRESSION.EXECUTOR,
      label: 'Executor',
      minScore: 80,
      summary: 'Execution conditions are strong and the setup is actionable.',
    };
  }

  if (score >= 70) {
    return {
      key: TIER_PROGRESSION.STRATEGIST,
      label: 'Strategist',
      minScore: 70,
      summary: 'The setup is organized enough to plan around, with live guardrails.',
    };
  }

  if (score >= 55) {
    return {
      key: TIER_PROGRESSION.ANALYST,
      label: 'Analyst',
      minScore: 55,
      summary: 'The setup is forming, but conviction still needs confirmation.',
    };
  }

  return {
    key: TIER_PROGRESSION.OBSERVER,
    label: 'Observer',
    minScore: 0,
    summary: 'Stay selective while the stack waits for clearer alignment.',
  };
}

function scoreMarketStructure({ signalType, change24h, change1h }) {
  const directionBonus =
    signalType === SIGNAL_TYPES.BUY
      ? change24h >= 0
        ? 8
        : -10
      : signalType === SIGNAL_TYPES.SELL
        ? change24h <= 0
          ? 8
          : -10
        : 0;

  return clamp(
    Math.round(48 + Math.abs(change24h) * 4.2 + Math.abs(change1h) * 9 + directionBonus),
    18,
    96
  );
}

function scoreModelConfidence({ confidence, secondaryConfidence, sentimentUp }) {
  const blendedConfidence =
    clamp((toFiniteNumber(confidence, 0.62) + toFiniteNumber(secondaryConfidence, 0.58)) / 2, 0.35, 0.99) *
    100;
  const sentimentLift = clamp((toFiniteNumber(sentimentUp, 50) - 50) * 0.35, -9, 12);
  return clamp(Math.round(blendedConfidence + sentimentLift), 20, 99);
}

function scoreResearchStrength({ catalystScore, newsCount, rationale }) {
  const catalystBase = catalystScore > 0 ? catalystScore * 10 : 46;
  const newsLift = clamp(newsCount * 4, 0, 18);
  const rationaleLift = rationale ? 6 : 0;
  return clamp(Math.round(catalystBase + newsLift + rationaleLift), 20, 97);
}

function scoreRiskDiscipline({ riskScore, confirmationRequired }) {
  const inverseRisk = 100 - clamp(riskScore, 0, 100);
  const confirmationPenalty = confirmationRequired ? 10 : 0;
  return clamp(Math.round(36 + inverseRisk * 0.58 - confirmationPenalty), 18, 96);
}

function scoreExecutionClarity({ signalAlignment, confirmationRequired, signalType }) {
  const alignmentBase =
    signalAlignment === 'STRONG'
      ? 84
      : signalAlignment === 'MEDIUM'
        ? 68
        : signalType === SIGNAL_TYPES.HOLD
          ? 42
          : 58;

  return clamp(alignmentBase - (confirmationRequired ? 12 : 0), 18, 95);
}

export function buildAptIntelligenceScore({
  symbol,
  baseSignal = {},
  liveData = {},
  prediction = null,
  enhanced = null,
  marketSentiment = null,
} = {}) {
  const signalType = resolveSignalType(
    enhanced || prediction || baseSignal || liveData || {}
  );
  const change24h = toFiniteNumber(
    enhanced?.market_data?.price_change_24h ??
      liveData?.change_24h ??
      baseSignal?.change24h,
    0
  );
  const change1h = toFiniteNumber(
    prediction?.indicators?.price_change_1h ??
      liveData?.change_1h ??
      enhanced?.market_data?.price_change_1h,
    change24h / 6
  );
  const primaryConfidence = toFiniteNumber(
    enhanced?.confidence ??
      prediction?.combined_confidence ??
      prediction?.confidence ??
      baseSignal?.confidence,
    0.62
  );
  const secondaryConfidence = toFiniteNumber(
    enhanced?.models?.random_forest?.confidence ??
      prediction?.ml_prediction?.win_probability ??
      prediction?.ml_prediction?.ml_confidence,
    primaryConfidence * 0.94
  );
  const catalystScore = toFiniteNumber(
    enhanced?.research_context?.catalyst_score,
    0
  );
  const newsCount = toFiniteNumber(
    enhanced?.research_context?.news_count ??
      enhanced?.research_context?.latest_news?.length,
    0
  );
  const riskScore = toFiniteNumber(
    prediction?.risk_score ?? baseSignal?.riskScore,
    50
  );
  const confirmationRequired = Boolean(enhanced?.confirmation_required);
  const signalAlignment = String(enhanced?.signal_alignment || '').toUpperCase();
  const sentimentUp = toFiniteNumber(
    enhanced?.market_data?.sentiment_up ?? marketSentiment?.sentiment_up,
    signalType === SIGNAL_TYPES.BUY ? 62 : signalType === SIGNAL_TYPES.SELL ? 44 : 52
  );
  const rationale =
    enhanced?.rationale_summary ||
    enhanced?.research_context?.rationale?.[0] ||
    baseSignal?.catalystSummary ||
    '';

  const marketStructure = scoreMarketStructure({
    signalType,
    change24h,
    change1h,
  });
  const modelConfidence = scoreModelConfidence({
    confidence: primaryConfidence,
    secondaryConfidence,
    sentimentUp,
  });
  const researchStrength = scoreResearchStrength({
    catalystScore,
    newsCount,
    rationale,
  });
  const riskDiscipline = scoreRiskDiscipline({
    riskScore,
    confirmationRequired,
  });
  const executionClarity = scoreExecutionClarity({
    signalAlignment,
    confirmationRequired,
    signalType,
  });

  const weightedScore =
    marketStructure * 0.22 +
    modelConfidence * 0.27 +
    researchStrength * 0.17 +
    riskDiscipline * 0.18 +
    executionClarity * 0.16;
  const score = clamp(Math.round(weightedScore), 18, 99);
  const tier = resolveTierProgression(score);
  const band = resolveAiTier(score);

  return {
    score,
    normalized: Number((score / 100).toFixed(2)),
    band,
    tier,
    symbol: symbol || baseSignal?.symbol || 'UNKNOWN',
    signalType,
    stance:
      signalType === SIGNAL_TYPES.HOLD
        ? 'Neutral'
        : score >= 80
          ? 'Aggressive'
          : score >= 65
            ? 'Balanced'
            : 'Defensive',
    drivers: [
      {
        key: 'market_structure',
        label: 'Market structure',
        score: marketStructure,
        detail: `${symbol || baseSignal?.symbol || 'Asset'} is printing ${change24h >= 0 ? 'positive' : 'negative'} 24h flow with ${Math.abs(change1h).toFixed(2)}% short-window drift.`,
      },
      {
        key: 'model_confidence',
        label: 'Model confidence',
        score: modelConfidence,
        detail: `Signal confidence stack is running at ${Math.round(primaryConfidence * 100)}% primary conviction.`,
      },
      {
        key: 'research_strength',
        label: 'Research strength',
        score: researchStrength,
        detail: rationale || 'Research context is still building for this symbol.',
      },
      {
        key: 'risk_discipline',
        label: 'Risk discipline',
        score: riskDiscipline,
        detail: confirmationRequired
          ? 'Sizing is throttled until confirmation clears.'
          : `Risk guardrails are aligned around a ${Math.round(riskScore)}/100 risk score.`,
      },
      {
        key: 'execution_clarity',
        label: 'Execution clarity',
        score: executionClarity,
        detail:
          signalAlignment === 'STRONG'
            ? 'Model alignment is strong enough to support faster execution.'
            : confirmationRequired
              ? 'Execution stays conservative while confirmation is pending.'
              : 'Execution path is open, but still expects runtime checks.',
      },
    ],
    summary: `${tier.label} tier at ${score}/100 APT Intelligence.`,
    timestamp: new Date().toISOString(),
  };
}
