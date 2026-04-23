// Polygon Amoy Testnet Configuration
export const NETWORKS = {
  polygon_amoy: {
    chainId: '0x13882', // 80002 in hex
    chainIdDecimal: 80002,
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [
      'https://rpc-amoy.polygon.technology/',
      'https://polygon-amoy.drpc.org',
      'https://polygon-amoy-bor-rpc.publicnode.com'
    ],
    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    faucetUrl: 'https://faucet.polygon.technology/'
  }
};

export const CURRENT_NETWORK = NETWORKS.polygon_amoy;
export const CHAIN_ID = 80002;
export const NETWORK_NAME = "Polygon Amoy";
export const EXPLORER_URL = "https://amoy.polygonscan.com";
export const FAUCET_URL = "https://faucet.polygon.technology/";
