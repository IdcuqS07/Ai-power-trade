import { APR_CONTEXTS, SODEX_STATES, SSI_STATUSES } from './enums';
import { resolveTierProgression, resolveSignalType } from './aptIntelligence';
import { parseChainIdValue } from './walletNetwork';

function toFiniteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildStateMeta(state) {
  switch (state) {
    case SODEX_STATES.LIVE_READY:
      return {
        label: 'Live Ready',
        shortLabel: 'Live',
        tone: 'var(--green)',
        pillToneClass: 'status-pill-live',
      };
    case SODEX_STATES.SIMULATION_READY:
      return {
        label: 'Simulation Ready',
        shortLabel: 'Simulation',
        tone: 'var(--yellow)',
        pillToneClass: 'status-pill-warn',
      };
    case SODEX_STATES.CONNECTED:
      return {
        label: 'Connected',
        shortLabel: 'Connected',
        tone: 'var(--cyan)',
        pillToneClass: 'status-pill-warn',
      };
    case SODEX_STATES.DEGRADED:
      return {
        label: 'Degraded',
        shortLabel: 'Degraded',
        tone: 'var(--red)',
        pillToneClass: 'status-pill-warn',
      };
    case SODEX_STATES.DISCONNECTED:
    default:
      return {
        label: 'Disconnected',
        shortLabel: 'Offline',
        tone: 'var(--text-tertiary)',
        pillToneClass: 'status-pill-preview',
      };
  }
}

export function resolveSodexRuntimeState({
  wallet = null,
  sodexStatus = null,
  chainId = null,
} = {}) {
  const configured = Boolean(sodexStatus?.configured);
  // Prefer backend state_machine state directly
  const backendStateMachine = sodexStatus?.state_machine || sodexStatus?.stateMachine || {};
  const backendEngine = sodexStatus?.executionEngine || {};
  const backendChecks = backendEngine.healthChecks || {};
  const backendHealth = String(backendEngine?.health || '').toUpperCase();
  const walletConnected = Boolean(wallet?.isConnected);
  const providerAvailable = Boolean(wallet?.providerAvailable);
  const walletWrongNetwork = Boolean(wallet?.isWrongNetwork);
  const runtimeChainId = parseChainIdValue(chainId || wallet?.chainId);
  const signingChainId = parseChainIdValue(
    sodexStatus?.signingNetwork?.chainId || sodexStatus?.signingChainId
  );
  const needsSigningSwitch = Boolean(
    walletConnected &&
      runtimeChainId &&
      signingChainId &&
      runtimeChainId !== signingChainId
  );
  const liveReady = Boolean(
    backendStateMachine?.live_ready === true ||
    (backendEngine?.liveReady && sodexStatus?.canPrepareOrder &&
      walletConnected &&
      !needsSigningSwitch &&
      backendHealth !== 'DEGRADED')
  );
  const simulationReady = Boolean(
    !liveReady &&
    (backendStateMachine?.simulation_ready === true ||
      sodexStatus?.simulationReady ||
      backendStateMachine?.state === SODEX_STATES.SIMULATION_READY ||
      backendEngine?.simulationReady ||
      configured)
  );

  // Use backend state_machine state directly when available
  const backendState = backendStateMachine?.state;
  let state = backendState || SODEX_STATES.DISCONNECTED;

  // Only use fallbacks when backend state is completely unavailable
  if (!backendState && !backendStateMachine?.state) {
    if (backendHealth === 'DEGRADED') {
      state = SODEX_STATES.DEGRADED;
    } else if (liveReady) {
      state = SODEX_STATES.LIVE_READY;
    } else if (simulationReady) {
      state = SODEX_STATES.SIMULATION_READY;
    } else if (walletConnected && configured) {
      state = SODEX_STATES.CONNECTED;
    }
  }

  // Preserve SIMULATION_READY state even if liveReady becomes true
  // The backend decides when to upgrade to LIVE_READY
  if (backendState && state === SODEX_STATES.SIMULATION_READY) {
    // Keep SIMULATION_READY as-is - backend is authoritative
  } else if (state === SODEX_STATES.SIMULATION_READY && liveReady && !backendState) {
    // Only upgrade if backend didn't explicitly set SIMULATION_READY
    state = SODEX_STATES.LIVE_READY;
  }

  const stateMeta = buildStateMeta(state);
  const latencyMs = toFiniteNumber(backendChecks?.latency?.latencyMs, null);
  const walletHealth = {
    status: !providerAvailable
      ? 'UNAVAILABLE'
      : !walletConnected
        ? 'DISCONNECTED'
        : walletWrongNetwork
          ? 'WRONG_NETWORK'
          : 'READY',
    label: !providerAvailable
      ? 'Install wallet'
      : !walletConnected
        ? 'Connect wallet'
        : walletWrongNetwork
          ? 'Switch network'
          : 'Ready',
    detail:
      !providerAvailable
        ? 'Browser wallet is not available yet.'
        : !walletConnected
          ? 'Connect a wallet to unlock runtime execution checks.'
          : walletWrongNetwork
            ? 'Wallet is connected, but not on the execution network.'
            : 'Wallet runtime checks are clear.',
  };
  const signingHealth = {
    status: liveReady
      ? 'READY'
      : needsSigningSwitch
        ? 'NETWORK_SWITCH_REQUIRED'
        : sodexStatus?.canPrepareOrder
          ? walletConnected
            ? 'AWAITING_SIGNATURE'
            : 'AWAITING_WALLET'
          : configured
            ? 'SIMULATION'
            : 'PREVIEW',
    label: liveReady
      ? 'Ready'
      : needsSigningSwitch
        ? 'Switch for signing'
        : sodexStatus?.canPrepareOrder
          ? walletConnected
            ? 'Awaiting signature'
            : 'Awaiting wallet'
          : configured
            ? 'Simulation fallback'
            : 'Preview',
    detail:
      backendChecks?.signing?.message ||
      (liveReady
        ? 'Typed data can be signed and submitted.'
        : needsSigningSwitch
          ? `Wallet must switch to ${sodexStatus?.signingNetwork?.chainName || 'ValueChain'} before signing.`
          : configured
            ? 'Live signing is not fully armed, but simulation mode can still run.'
            : 'SoDEX signing is not configured yet.'),
  };
  const latencyHealth = {
    status: String(backendChecks?.latency?.status || (latencyMs != null ? 'HEALTHY' : 'UNKNOWN')).toUpperCase(),
    label:
      latencyMs != null
        ? `${Math.round(latencyMs)}ms`
        : backendChecks?.latency?.label || 'Unknown',
    detail:
      backendChecks?.latency?.message ||
      (latencyMs != null
        ? 'Gateway latency probe completed.'
        : 'Latency probe has not reported yet.'),
  };

  return {
    state,
    ...stateMeta,
    configured,
    liveReady,
    simulationReady,
    needsSigningSwitch,
    healthChecks: {
      wallet: walletHealth,
      signing: signingHealth,
      latency: latencyHealth,
    },
    summary:
      state === SODEX_STATES.LIVE_READY
        ? 'Wallet, signing, and gateway checks are aligned for live SoDEX execution.'
        : state === SODEX_STATES.SIMULATION_READY
          ? 'Runtime can execute through the simulation-ready path while live signing stays on standby.'
          : state === SODEX_STATES.CONNECTED
            ? 'Wallet is connected, but SoDEX still needs more execution readiness.'
            : state === SODEX_STATES.DEGRADED
              ? 'Gateway or signing health is degraded, so execution should stay conservative.'
              : 'Connect a wallet to unlock runtime execution states.',
  };
}

export function resolveSsiRuntimeState({
  wallet = null,
  ssiProfile = null,
  intelligence = null,
} = {}) {
  const explicitStatus = String(wallet?.ssiStatus || '').toUpperCase();
  const validStatuses = new Set(Object.values(SSI_STATUSES));
  const status = validStatuses.has(explicitStatus)
    ? explicitStatus
    : wallet?.initializing
      ? SSI_STATUSES.INITIALIZING
      : !wallet?.isConnected
        ? SSI_STATUSES.PREVIEW
        : wallet?.ssiError
          ? SSI_STATUSES.UNAVAILABLE
          : ssiProfile
            ? SSI_STATUSES.READY
            : SSI_STATUSES.SYNCING;
  const participationScore = toFiniteNumber(
    ssiProfile?.participation?.score,
    toFiniteNumber(intelligence?.score, null)
  );
  const fallbackTier = resolveTierProgression(participationScore || 0);
  const tierLabel = ssiProfile?.holding?.tier?.label || fallbackTier.label;

  return {
    status,
    label:
      status === SSI_STATUSES.READY
        ? 'Ready'
        : status === SSI_STATUSES.SYNCING
          ? 'Syncing'
          : status === SSI_STATUSES.INITIALIZING
            ? 'Initializing'
            : status === SSI_STATUSES.UNAVAILABLE
              ? 'Unavailable'
              : 'Preview',
    badgeToneClass:
      status === SSI_STATUSES.READY
        ? 'status-pill-live'
        : status === SSI_STATUSES.PREVIEW
          ? 'status-pill-preview'
          : 'status-pill-warn',
    participationScore,
    tier: {
      ...fallbackTier,
      label: tierLabel,
    },
    summary:
      status === SSI_STATUSES.READY
        ? 'SSI participation data is live and can inform APR context.'
        : status === SSI_STATUSES.SYNCING
          ? 'SSI participation is connected, but the latest profile is still syncing.'
          : status === SSI_STATUSES.INITIALIZING
            ? 'Wallet bootstrapping is still initializing the SSI layer.'
            : status === SSI_STATUSES.UNAVAILABLE
              ? 'SSI service is unavailable, so the workspace is using intelligent fallbacks.'
              : 'SSI remains in preview until a wallet is connected.',
  };
}

export function buildContextualApr({
  ssiProfile = null,
  intelligence = null,
  sodexRuntime = null,
  activeSignal = null,
} = {}) {
  const signalType = resolveSignalType(activeSignal || {});
  const intelligenceScore = toFiniteNumber(intelligence?.score, 58);
  const participationScore = toFiniteNumber(
    ssiProfile?.participation?.score,
    intelligenceScore
  );
  const liveApr = toFiniteNumber(
    ssiProfile?.rewards?.estimated_program_apr,
    null
  );
  const regime = String(activeSignal?.regime || '').toLowerCase();
  const neutralTape =
    signalType === 'HOLD' ||
    /neutral|consolidation|defensive/.test(regime);

  let mode = APR_CONTEXTS.PROJECTED;

  if (neutralTape) {
    mode = APR_CONTEXTS.MARKET_NEUTRAL;
  } else if (sodexRuntime?.liveReady && intelligenceScore >= 70) {
    mode = APR_CONTEXTS.LIVE_STRATEGY;
  }

  const projectedBase =
    liveApr != null
      ? liveApr
      : 3.8 + intelligenceScore * 0.085 + participationScore * 0.018;
  const value =
    mode === APR_CONTEXTS.MARKET_NEUTRAL
      ? Math.max(3.2, projectedBase * 0.58)
      : mode === APR_CONTEXTS.LIVE_STRATEGY
        ? Math.min(22.5, projectedBase + 1.9)
        : Math.min(19.5, projectedBase);

  return {
    mode,
    label:
      mode === APR_CONTEXTS.LIVE_STRATEGY
        ? 'Live Strategy APR'
        : mode === APR_CONTEXTS.MARKET_NEUTRAL
          ? 'Market Neutral APR'
          : 'Projected APR',
    value: Number(value.toFixed(1)),
    displayValue: `${Number(value).toFixed(1)}%`,
    detail:
      mode === APR_CONTEXTS.LIVE_STRATEGY
        ? 'APR reflects live execution posture with SoDEX and SSI aligned.'
        : mode === APR_CONTEXTS.MARKET_NEUTRAL
          ? 'APR is throttled for neutral tape and defensive positioning.'
          : 'APR is projected from intelligence score, participation, and runtime readiness.',
  };
}
