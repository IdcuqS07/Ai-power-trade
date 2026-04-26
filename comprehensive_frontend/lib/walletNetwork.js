export const DEFAULT_CHAIN_CONFIGS = {
  97: {
    chainId: '0x61',
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: [
      'https://bsc-testnet.publicnode.com',
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
    ],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    faucetUrl: 'https://www.bnbchain.org/en/testnet-faucet',
  },
  80002: {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: [
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy-bor-rpc.publicnode.com',
    ],
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
    faucetUrl: 'https://faucet.polygon.technology',
  },
};

export const FALLBACK_TOKEN = {
  name: 'AI Trade USDT',
  symbol: 'atUSDT',
  decimals: 18,
  contractAddress: null,
  explorerUrl: null,
};

export function parseChainIdValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value) {
    if (value.startsWith('0x') || value.startsWith('0X')) {
      return parseInt(value, 16);
    }

    return parseInt(value, 10);
  }

  return null;
}

export function normalizeChainId(value) {
  const parsed = parseChainIdValue(value);
  return parsed == null || Number.isNaN(parsed) ? null : `0x${parsed.toString(16)}`;
}

export function getDefaultChainConfig(chainId = 97) {
  const base = DEFAULT_CHAIN_CONFIGS[chainId] || DEFAULT_CHAIN_CONFIGS[97];

  return {
    chainId: normalizeChainId(base.chainId),
    chainName: base.chainName,
    nativeCurrency: { ...base.nativeCurrency },
    rpcUrls: [...(base.rpcUrls || [])],
    blockExplorerUrls: [...(base.blockExplorerUrls || [])],
    faucetUrl: base.faucetUrl || null,
  };
}

export function resolveBlockchainConfig(payload) {
  const data = payload?.data || {};
  const network = data.network || {};
  const token = data.token || {};
  const chainId =
    parseChainIdValue(token.chain_id) ||
    parseChainIdValue(network.chain_id) ||
    97;
  const base = getDefaultChainConfig(chainId);
  const explorerUrl =
    token.explorer ||
    network.explorer ||
    base.blockExplorerUrls[0] ||
    null;

  return {
    network: {
      ...base,
      chainId: normalizeChainId(chainId),
      blockExplorerUrls: explorerUrl ? [explorerUrl] : base.blockExplorerUrls,
    },
    token: {
      name: token.name || FALLBACK_TOKEN.name,
      symbol: token.symbol || FALLBACK_TOKEN.symbol,
      decimals: Number(token.decimals || FALLBACK_TOKEN.decimals),
      contractAddress: token.contract_address || null,
      explorerUrl,
    },
  };
}

export function getChainLabel(chainId) {
  const parsed = parseChainIdValue(chainId);

  if (parsed != null && DEFAULT_CHAIN_CONFIGS[parsed]) {
    return DEFAULT_CHAIN_CONFIGS[parsed].chainName;
  }

  if (parsed != null) {
    return `Chain ${parsed}`;
  }

  return 'Unknown network';
}

export function shortenAddress(value) {
  if (!value || value.length < 10) {
    return value || 'Unknown wallet';
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
