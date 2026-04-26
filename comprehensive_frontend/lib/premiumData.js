const createSeries = (basePrice, deltas) => {
  let price = basePrice;

  return deltas.map((delta, index) => {
    price = Number((price + delta).toFixed(2));

    return {
      time: `${String(index + 1).padStart(2, '0')}:00`,
      price,
      confidence: Math.max(58, Math.min(96, 68 + index * 2 + Math.round(delta / 45))),
      volume: 120 + index * 14 + Math.abs(Math.round(delta / 10)),
    };
  });
};

export const aiSignals = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    signal: 'Long Bias',
    confidence: 0.92,
    confidenceLabel: 'Institutional Grade',
    price: 94280,
    change24h: 2.18,
    horizon: '12-36h',
    regime: 'Momentum Expansion',
    setup: 'Breakout continuation above spot-led liquidity shelf',
    catalystSummary: 'ETF demand, short-covering, and stablecoin inflows continue to reinforce upside continuation.',
    entryZone: '$93,850 - $94,200',
    stopLoss: '$92,460',
    targetZone: '$96,900 / $98,400',
    rewardRisk: '2.6x',
    simulatedEdge: '+4.8%',
    riskScore: 31,
    confidenceDrivers: [
      { label: 'Order flow alignment', weight: 29, detail: 'Coinbase spot premium and perpetual basis both confirm the move.' },
      { label: 'Macro backdrop', weight: 22, detail: 'Dollar softness and risk-on beta rotation support high-quality majors.' },
      { label: 'Catalyst density', weight: 19, detail: 'ETF inflow cadence and treasury accumulation remain constructive.' },
      { label: 'Technical structure', weight: 18, detail: 'Acceptance above prior resistance flips the market into trend mode.' },
      { label: 'On-chain behavior', weight: 12, detail: 'Exchange balances are flat-to-down while large wallet activity rises.' },
    ],
    catalysts: [
      { title: 'ETF flow acceleration', impact: 'High', horizon: 'Today', detail: 'Spot demand remains the cleanest narrative for continuation.' },
      { title: 'Short gamma squeeze window', impact: 'High', horizon: '4-8h', detail: 'Dealer positioning can amplify upside if $95k is reclaimed.' },
      { title: 'Treasury wallet accumulation', impact: 'Medium', horizon: 'This week', detail: 'Corporate accumulation supports the bid on pullbacks.' },
    ],
    riskVectors: [
      { label: 'Event reversal', value: 28, commentary: 'A sharp macro headline can unwind breakout participation quickly.' },
      { label: 'Funding overheating', value: 41, commentary: 'Perp positioning is rich, but not yet at liquidation extremes.' },
      { label: 'Execution slippage', value: 19, commentary: 'Deep liquidity keeps slippage contained for base-sized clips.' },
    ],
    orderFlow: [
      { venue: 'Binance perp', bias: 'Net long', value: '+14%' },
      { venue: 'Coinbase spot', bias: 'Aggressive bid', value: '+0.42%' },
      { venue: 'On-chain stablecoins', bias: 'Positive', value: '+$280M' },
    ],
    chart: createSeries(93640, [120, 84, -52, 166, 214, -44, 126, 148, 82, -31, 144, 90]),
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    signal: 'Scale In',
    confidence: 0.84,
    confidenceLabel: 'High Confidence',
    price: 4875,
    change24h: 1.42,
    horizon: '24-48h',
    regime: 'Selective Rotation',
    setup: 'Relative strength reset with smart-contract beta re-rating',
    catalystSummary: 'Layer-2 activity and staking demand support ETH, but leadership is slightly behind BTC.',
    entryZone: '$4,810 - $4,845',
    stopLoss: '$4,695',
    targetZone: '$5,020 / $5,140',
    rewardRisk: '2.1x',
    simulatedEdge: '+3.2%',
    riskScore: 38,
    confidenceDrivers: [
      { label: 'Cross-asset rotation', weight: 25, detail: 'ETH beta improves when majors lead and rates volatility stays soft.' },
      { label: 'Staking demand', weight: 21, detail: 'Staked supply keeps spot liquidity thinner than headlines imply.' },
      { label: 'AI research alignment', weight: 20, detail: 'Narrative flow is improving after recent ecosystem catalysts.' },
      { label: 'Trend persistence', weight: 19, detail: 'Market structure remains constructive above the four-hour VWAP.' },
      { label: 'Volatility regime', weight: 15, detail: 'Realized vol is cooling, which improves laddered entries.' },
    ],
    catalysts: [
      { title: 'L2 growth beat', impact: 'Medium', horizon: 'Today', detail: 'Higher throughput metrics help reinforce the ecosystem bid.' },
      { title: 'Staking queue expansion', impact: 'Medium', horizon: 'This week', detail: 'Supply lock-up helps absorb sell pressure on dips.' },
      { title: 'AI token spillover', impact: 'Low', horizon: 'Ongoing', detail: 'Risk-on behavior in adjacent sectors supports ETH beta.' },
    ],
    riskVectors: [
      { label: 'Leadership lag', value: 36, commentary: 'If BTC runs without broad participation, ETH can underperform.' },
      { label: 'Gas spike shock', value: 29, commentary: 'Unexpected fee spikes can cool rotation into the ecosystem.' },
      { label: 'Execution slippage', value: 22, commentary: 'Spot depth is healthy, especially for staged entries.' },
    ],
    orderFlow: [
      { venue: 'Deribit options', bias: 'Call skew', value: '+9%' },
      { venue: 'L2 bridge flow', bias: 'Accumulating', value: '+$116M' },
      { venue: 'CEX netflow', bias: 'Outflow', value: '-18.4k ETH' },
    ],
    chart: createSeries(4790, [18, 24, -10, 20, 12, 28, -8, 31, 22, -7, 15, 10]),
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    signal: 'Tactical Long',
    confidence: 0.79,
    confidenceLabel: 'Actionable',
    price: 214.7,
    change24h: 4.11,
    horizon: '8-18h',
    regime: 'High Beta Expansion',
    setup: 'Ecosystem momentum with catalyst-backed follow-through',
    catalystSummary: 'Developer activity and memecoin velocity keep the tape fast, but risk is materially higher than BTC and ETH.',
    entryZone: '$211.20 - $213.10',
    stopLoss: '$205.80',
    targetZone: '$221.80 / $226.40',
    rewardRisk: '2.4x',
    simulatedEdge: '+5.6%',
    riskScore: 49,
    confidenceDrivers: [
      { label: 'Catalyst velocity', weight: 28, detail: 'Narratives on Solana move quickly and reinforce trend persistence.' },
      { label: 'Retail flow', weight: 23, detail: 'Aggressive spot participation is improving market breadth.' },
      { label: 'Technical breakout', weight: 18, detail: 'Price reclaimed a multi-session supply zone with volume.' },
      { label: 'Liquidity quality', weight: 17, detail: 'Liquidity is adequate but still less forgiving than BTC.' },
      { label: 'Funding heat', weight: 14, detail: 'Funding is elevated, reducing room for poor execution.' },
    ],
    catalysts: [
      { title: 'Ecosystem launch calendar', impact: 'High', horizon: '24h', detail: 'Upcoming launches keep speculative attention elevated.' },
      { title: 'Stablecoin transfer growth', impact: 'Medium', horizon: 'Today', detail: 'Capital velocity remains a positive signal for activity.' },
      { title: 'Developer momentum', impact: 'Medium', horizon: 'This week', detail: 'Hackathon and tooling momentum support longer-term credibility.' },
    ],
    riskVectors: [
      { label: 'Funding reset', value: 47, commentary: 'Crowded perp positioning can force a fast flush.' },
      { label: 'Narrative fade', value: 39, commentary: 'Speculative sectors can cool without warning.' },
      { label: 'Execution slippage', value: 34, commentary: 'Clip sizing matters more here than in BTC or ETH.' },
    ],
    orderFlow: [
      { venue: 'Perp funding', bias: 'Hot', value: '+0.038%' },
      { venue: 'DEX volume', bias: 'Elevated', value: '+22%' },
      { venue: 'Whale transfers', bias: 'Constructive', value: '31 wallets' },
    ],
    chart: createSeries(205.4, [1.8, 2.1, -0.9, 3.4, 1.6, -1.2, 2.7, 1.9, 0.8, -0.5, 1.6, 1.0]),
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    signal: 'Watch Breakout',
    confidence: 0.72,
    confidenceLabel: 'Conditional',
    price: 29.34,
    change24h: 3.68,
    horizon: '1-3d',
    regime: 'Accumulation to Expansion',
    setup: 'Infrastructure beta with improving research tone',
    catalystSummary: 'LINK benefits from tokenization and oracle demand narratives, but still needs confirmation above resistance.',
    entryZone: '$28.90 - $29.10',
    stopLoss: '$27.80',
    targetZone: '$30.90 / $31.70',
    rewardRisk: '2.0x',
    simulatedEdge: '+4.1%',
    riskScore: 43,
    confidenceDrivers: [
      { label: 'Narrative relevance', weight: 27, detail: 'Tokenization and cross-chain settlement keep LINK strategically relevant.' },
      { label: 'Research corroboration', weight: 22, detail: 'Multiple catalysts align, but timing is still confirmation-dependent.' },
      { label: 'Technical positioning', weight: 18, detail: 'Compression below resistance often resolves into sharp moves.' },
      { label: 'Relative volume', weight: 17, detail: 'Volume is improving, though not yet in breakout territory.' },
      { label: 'Market beta', weight: 16, detail: 'Sector strength depends on majors staying supportive.' },
    ],
    catalysts: [
      { title: 'Tokenization partnerships', impact: 'Medium', horizon: 'This week', detail: 'Enterprise settlement headlines reinforce the narrative.' },
      { title: 'Oracle usage expansion', impact: 'Medium', horizon: 'Ongoing', detail: 'More integrations improve fundamental storytelling.' },
      { title: 'Macro risk-on', impact: 'Low', horizon: 'Today', detail: 'Broader market strength helps secondary majors participate.' },
    ],
    riskVectors: [
      { label: 'False breakout', value: 46, commentary: 'LINK needs confirmation; patience matters.' },
      { label: 'Sector de-prioritization', value: 33, commentary: 'Capital may rotate to higher beta names instead.' },
      { label: 'Execution slippage', value: 24, commentary: 'Reasonable depth, but still less liquid than BTC/ETH.' },
    ],
    orderFlow: [
      { venue: 'Spot breadth', bias: 'Improving', value: '+11%' },
      { venue: 'On-chain active addresses', bias: 'Uptrend', value: '+7.4%' },
      { venue: 'Options skew', bias: 'Balanced', value: '+2%' },
    ],
    chart: createSeries(28.1, [0.16, 0.19, -0.08, 0.22, 0.11, -0.05, 0.28, 0.17, 0.08, -0.04, 0.12, 0.08]),
  },
];

export const modelStatus = [
  {
    name: 'LSTM Price Model',
    status: 'Trained',
    tone: 'green',
    details: ['Status: Active', 'Window: 60 candles', 'Accuracy: 94.2%'],
  },
  {
    name: 'Market Regime Engine',
    status: 'Active',
    tone: 'cyan',
    details: ['Status: Live', 'Breadth monitor: enabled', 'Accuracy: 91.8%'],
  },
  {
    name: 'On-Chain Flow Layer',
    status: 'Connected',
    tone: 'green',
    details: ['Status: Synced', 'Stablecoin watch: real-time', 'Whale alerts: enabled'],
  },
  {
    name: 'Execution Guardrail',
    status: 'Ready',
    tone: 'amber',
    details: ['Status: Armed', 'Slippage tiers: dynamic', 'Route profile: Polygon'],
  },
];

export const researchFeed = [
  {
    id: 'rf-1',
    tag: 'Macro',
    title: 'Stablecoin liquidity keeps widening the bid across majors',
    summary: 'Fresh stablecoin issuance is broadening deployable buying power and reducing the need for forced de-risking.',
    whyItMatters: 'Supports the AI tilt toward continuation setups with tighter invalidation levels.',
    sentiment: 'Constructive',
    related: ['BTC', 'ETH'],
  },
  {
    id: 'rf-2',
    tag: 'Flows',
    title: 'ETF participation remains the cleanest directional signal',
    summary: 'Institutional flow persistence continues to anchor the BTC tape even when intraday leverage shakes out.',
    whyItMatters: 'Raises confidence for spot-led breakouts and reduces headline sensitivity on dips.',
    sentiment: 'Bullish',
    related: ['BTC'],
  },
  {
    id: 'rf-3',
    tag: 'Ecosystem',
    title: 'Solana developer momentum is translating into faster capital rotation',
    summary: 'Build velocity and launch cadence are feeding a reflexive loop of attention, liquidity, and speculative demand.',
    whyItMatters: 'Validates tactical longs, but only with strict risk limits because sentiment can overheat quickly.',
    sentiment: 'High Beta',
    related: ['SOL'],
  },
  {
    id: 'rf-4',
    tag: 'Infrastructure',
    title: 'Tokenization narrative lifts oracle and middleware names',
    summary: 'As real-world asset infrastructure gains mindshare, oracle demand narratives are regaining institutional attention.',
    whyItMatters: 'Creates a credible catalyst path for LINK if price confirms above resistance.',
    sentiment: 'Improving',
    related: ['LINK', 'ETH'],
  },
];

export const assetLookup = aiSignals.reduce((accumulator, asset) => {
  accumulator[asset.symbol] = asset;
  return accumulator;
}, {});

export const getSignalBySymbol = (symbol = 'BTC') => {
  const normalized = symbol.toUpperCase();
  return assetLookup[normalized] || aiSignals[0];
};

export const mergeSignalsWithLivePrices = (signals, livePrices = {}) =>
  signals.map((signal) => {
    const live = livePrices[signal.symbol];

    if (!live) {
      return signal;
    }

    return {
      ...signal,
      price: Number(live.price || signal.price),
      change24h: Number(live.change_24h ?? signal.change24h),
    };
  });
