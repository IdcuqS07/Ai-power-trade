import { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  FALLBACK_TOKEN,
  getChainLabel,
  getDefaultChainConfig,
  normalizeChainId,
  resolveBlockchainConfig,
  shortenAddress,
} from '../lib/walletNetwork';
import { getInjectedWalletProvider, waitForInjectedWalletProvider } from '../lib/browserWallet';

const WalletContext = createContext(null);

const API_PREFIX = '/api/backend';
const WALLET_STORAGE_KEY = 'wallet_address';
const WALLET_DISCONNECT_STORAGE_KEY = 'wallet_disconnected';

function isSupportedChain(chainId, networkConfig) {
  const activeChainId = normalizeChainId(chainId);
  const targetChainId = normalizeChainId(networkConfig?.chainId);

  return Boolean(activeChainId && targetChainId && activeChainId === targetChainId);
}

function createInitialWalletState() {
  return {
    initializing: true,
    providerAvailable: false,
    status: 'idle',
    message: 'Wallet not connected',
    account: null,
    chainId: null,
    tokenBalance: null,
    canClaim: false,
    cooldownSeconds: 0,
    networkConfig: getDefaultChainConfig(),
    tokenMeta: FALLBACK_TOKEN,
  };
}

async function fetchWalletJson(path) {
  const response = await fetch(`${API_PREFIX}/${path}`);
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.detail ||
        payload?.error ||
        payload?.message ||
        `Wallet request failed with status ${response.status}`
    );
  }

  if (payload?.success === false) {
    throw new Error(payload.detail || payload.error || payload.message || 'Wallet request failed');
  }

  return payload;
}

export function WalletProvider({ children }) {
  const [walletState, setWalletState] = useState(createInitialWalletState);
  const mountedRef = useRef(false);
  const providerRef = useRef(null);
  const [providerRevision, setProviderRevision] = useState(0);

  const updateProviderRef = (nextProvider = null) => {
    const resolvedProvider = nextProvider || getInjectedWalletProvider();

    if (providerRef.current !== resolvedProvider) {
      providerRef.current = resolvedProvider;
      setProviderRevision((current) => current + 1);
    }

    return resolvedProvider;
  };

  const readProvider = () => {
    return providerRef.current || updateProviderRef();
  };

  const safeSetWalletState = (updater) => {
    if (!mountedRef.current) {
      return;
    }

    setWalletState(updater);
  };

  const persistWalletAddress = (address) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (address) {
        window.localStorage.setItem(WALLET_STORAGE_KEY, address);
        return;
      }

      window.localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (error) {
      console.warn('Wallet persistence unavailable:', error);
    }
  };

  const readDisconnectPreference = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return window.localStorage.getItem(WALLET_DISCONNECT_STORAGE_KEY) === 'true';
    } catch (error) {
      console.warn('Wallet disconnect preference unavailable:', error);
      return false;
    }
  };

  const persistDisconnectPreference = (disconnected) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (disconnected) {
        window.localStorage.setItem(WALLET_DISCONNECT_STORAGE_KEY, 'true');
        return;
      }

      window.localStorage.removeItem(WALLET_DISCONNECT_STORAGE_KEY);
    } catch (error) {
      console.warn('Wallet disconnect preference unavailable:', error);
    }
  };

  const refreshBlockchainConfig = async () => {
    try {
      const payload = await fetchWalletJson('blockchain/status');
      const resolved = resolveBlockchainConfig(payload);

      safeSetWalletState((current) => ({
        ...current,
        networkConfig: resolved.network,
        tokenMeta: resolved.token,
      }));

      return resolved;
    } catch (error) {
      console.warn('Blockchain config fallback:', error);

      const fallback = {
        network: getDefaultChainConfig(),
        token: FALLBACK_TOKEN,
      };

      safeSetWalletState((current) => ({
        ...current,
        networkConfig: fallback.network,
        tokenMeta: fallback.token,
      }));

      return fallback;
    }
  };

  const refreshBalance = async (addressOverride) => {
    const nextAddress = addressOverride || walletState.account;

    if (!nextAddress) {
      safeSetWalletState((current) => ({
        ...current,
        tokenBalance: null,
        canClaim: false,
        cooldownSeconds: 0,
      }));
      return null;
    }

    try {
      const payload = await fetchWalletJson(`blockchain/balance/${nextAddress}`);
      const data = payload?.data || {};

      safeSetWalletState((current) => ({
        ...current,
        tokenBalance: Number(data.balance || 0),
        canClaim: Boolean(data.can_claim_faucet),
        cooldownSeconds: Number(data.cooldown_seconds || 0),
      }));

      return data;
    } catch (error) {
      console.warn('Wallet balance refresh failed:', error);
      return null;
    }
  };

  const syncWalletFromProvider = async ({
    disconnectedMessage = 'Wallet not connected',
    networkConfigOverride = null,
    providerOverride = null,
    respectDisconnectPreference = true,
  } = {}) => {
    const provider = updateProviderRef(providerOverride);

    if (!provider) {
      safeSetWalletState((current) => ({
        ...current,
        initializing: false,
        providerAvailable: false,
        status: 'unavailable',
        message: 'Install MetaMask to connect your wallet',
        account: null,
        chainId: null,
        tokenBalance: null,
        canClaim: false,
        cooldownSeconds: 0,
      }));

      return {
        account: null,
        chainId: null,
        ready: false,
      };
    }

    let nextChainId = null;
    let nextAccount = null;

    try {
      nextChainId = normalizeChainId(await provider.request({ method: 'eth_chainId' }));
    } catch (error) {
      console.warn('Wallet chain lookup failed:', error);
    }

    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      nextAccount = accounts?.[0] || null;
    } catch (error) {
      console.warn('Wallet account lookup failed:', error);
    }

    const isManuallyDisconnected = respectDisconnectPreference && readDisconnectPreference();
    const visibleAccount = isManuallyDisconnected ? null : nextAccount;

    persistWalletAddress(visibleAccount);

    const activeNetworkConfig = networkConfigOverride || walletState.networkConfig;

    safeSetWalletState((current) => {
      const nextNetworkConfig = networkConfigOverride || current.networkConfig;
      const onSupportedChain = Boolean(visibleAccount && isSupportedChain(nextChainId, nextNetworkConfig));

      return {
        ...current,
        initializing: false,
        providerAvailable: true,
        account: visibleAccount,
        chainId: nextChainId,
        status: !visibleAccount ? 'idle' : onSupportedChain ? 'connected' : 'wrong-network',
        message: !visibleAccount
          ? disconnectedMessage
          : onSupportedChain
            ? 'Wallet connected'
            : `Switch to ${nextNetworkConfig.chainName} to continue`,
      };
    });

    if (visibleAccount) {
      await refreshBalance(visibleAccount);
    } else {
      safeSetWalletState((current) => ({
        ...current,
        tokenBalance: null,
        canClaim: false,
        cooldownSeconds: 0,
      }));
    }

    return {
      account: visibleAccount,
      chainId: nextChainId,
      ready: Boolean(visibleAccount && isSupportedChain(nextChainId, activeNetworkConfig)),
    };
  };

  const openInstallWallet = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.open('https://metamask.io/download/', '_blank');
  };

  const switchToSupportedNetwork = async (networkConfigOverride = null) => {
    const provider = readProvider() || (await waitForInjectedWalletProvider());

    if (!provider) {
      openInstallWallet();
      return false;
    }

    const targetConfig = networkConfigOverride || walletState.networkConfig;

    if (!targetConfig?.chainId) {
      return false;
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetConfig.chainId }],
      });

      const synced = await syncWalletFromProvider({ networkConfigOverride: targetConfig });
      return Boolean(synced.ready || synced.account);
    } catch (error) {
      if (error?.code === 4902 && targetConfig.rpcUrls?.length) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: targetConfig.chainId,
              chainName: targetConfig.chainName,
              nativeCurrency: targetConfig.nativeCurrency,
              rpcUrls: targetConfig.rpcUrls,
              blockExplorerUrls: targetConfig.blockExplorerUrls,
            },
          ],
        });

        await syncWalletFromProvider({ networkConfigOverride: targetConfig });
        return true;
      }

      safeSetWalletState((current) => ({
        ...current,
        status: 'error',
        message: error.message || 'Failed to switch wallet network',
      }));

      throw error;
    }
  };

  const addTokenToMetaMask = async () => {
    const provider = readProvider() || (await waitForInjectedWalletProvider());
    const contractAddress = walletState.tokenMeta.contractAddress;

    if (!provider || !contractAddress) {
      return false;
    }

    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: contractAddress,
            symbol: walletState.tokenMeta.symbol,
            decimals: walletState.tokenMeta.decimals,
          },
        },
      });

      return true;
    } catch (error) {
      console.warn('Add token error:', error);
      return false;
    }
  };

  const connectWallet = async () => {
    const provider = readProvider() || (await waitForInjectedWalletProvider());

    if (!provider) {
      openInstallWallet();
      return false;
    }

    safeSetWalletState((current) => ({
      ...current,
      status: 'connecting',
      message: 'Waiting for wallet approval',
    }));

    try {
      persistDisconnectPreference(false);

      const resolved = await refreshBlockchainConfig();
      const targetConfig = resolved?.network || walletState.networkConfig;

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const nextAccount = accounts?.[0] || null;

      if (!nextAccount) {
        throw new Error('No wallet account was returned');
      }

      persistWalletAddress(nextAccount);

      const nextChainId = normalizeChainId(await provider.request({ method: 'eth_chainId' }));
      const targetChainId = normalizeChainId(targetConfig.chainId);

      safeSetWalletState((current) => ({
        ...current,
        providerAvailable: true,
        account: nextAccount,
        chainId: nextChainId,
      }));

      if (targetChainId && nextChainId !== targetChainId) {
        safeSetWalletState((current) => ({
          ...current,
          status: 'wrong-network',
          message: `Switching network to ${targetConfig.chainName}...`,
        }));

        await switchToSupportedNetwork(targetConfig);
      }

      await syncWalletFromProvider({
        networkConfigOverride: targetConfig,
        respectDisconnectPreference: false,
      });
      return true;
    } catch (error) {
      safeSetWalletState((current) => ({
        ...current,
        status: 'error',
        message:
          error?.code === 4001
            ? 'Wallet connection was rejected'
            : error.message || 'Failed to connect wallet',
      }));

      return false;
    }
  };

  const disconnectWallet = async () => {
    const provider = readProvider();

    persistDisconnectPreference(true);
    persistWalletAddress(null);

    safeSetWalletState((current) => ({
      ...current,
      initializing: false,
      providerAvailable: Boolean(provider),
      status: 'idle',
      message: 'Wallet disconnected',
      account: null,
      tokenBalance: null,
      canClaim: false,
      cooldownSeconds: 0,
    }));

    if (!provider) {
      return true;
    }

    try {
      await provider.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      // Most injected wallets do not support an app-triggered hard disconnect.
      // The app-level disconnect state above is the reliable fallback.
    }

    return true;
  };

  const switchWallet = async () => {
    const provider = readProvider() || (await waitForInjectedWalletProvider());

    if (!provider) {
      openInstallWallet();
      return false;
    }

    safeSetWalletState((current) => ({
      ...current,
      status: 'connecting',
      message: 'Choose a wallet account',
    }));

    try {
      persistDisconnectPreference(false);

      const resolved = await refreshBlockchainConfig();
      const targetConfig = resolved?.network || walletState.networkConfig;

      try {
        await provider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        if (error?.code === 4001) {
          throw error;
        }

        await provider.request({ method: 'eth_requestAccounts' });
      }

      const synced = await syncWalletFromProvider({
        networkConfigOverride: targetConfig,
        respectDisconnectPreference: false,
      });

      if (!synced.account) {
        throw new Error('No wallet account was returned');
      }

      const targetChainId = normalizeChainId(targetConfig.chainId);

      if (targetChainId && synced.chainId !== targetChainId) {
        safeSetWalletState((current) => ({
          ...current,
          status: 'wrong-network',
          message: `Switching network to ${targetConfig.chainName}...`,
        }));

        await switchToSupportedNetwork(targetConfig);
      }

      return true;
    } catch (error) {
      safeSetWalletState((current) => ({
        ...current,
        status: 'error',
        message:
          error?.code === 4001
            ? 'Wallet selection was rejected'
            : error.message || 'Failed to switch wallet',
      }));

      return false;
    }
  };

  const ensureWalletReady = async () => {
    const provider = readProvider() || (await waitForInjectedWalletProvider());

    if (!provider) {
      openInstallWallet();
      return false;
    }

    if (!walletState.account) {
      return connectWallet();
    }

    const activeChainId = normalizeChainId(walletState.chainId);
    const targetChainId = normalizeChainId(walletState.networkConfig.chainId);

    if (targetChainId && activeChainId !== targetChainId) {
      try {
        await switchToSupportedNetwork(walletState.networkConfig);
      } catch (error) {
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const handleProviderDetected = (provider) => {
      const resolvedProvider = updateProviderRef(provider);

      safeSetWalletState((current) => ({
        ...current,
        providerAvailable: Boolean(resolvedProvider),
      }));

      return resolvedProvider;
    };

    const bootstrapWallet = async () => {
      const resolved = await refreshBlockchainConfig();
      const provider = await waitForInjectedWalletProvider();

      if (!active) {
        return;
      }

      handleProviderDetected(provider);
      await syncWalletFromProvider({
        networkConfigOverride: resolved?.network || null,
        providerOverride: provider,
      });
    };

    const handleEthereumInitialized = () => {
      const provider = handleProviderDetected(getInjectedWalletProvider());

      Promise.resolve(
        syncWalletFromProvider({
          providerOverride: provider,
        })
      ).catch((error) => {
        console.error('Wallet provider initialization failed:', error);
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', handleEthereumInitialized);
    }

    Promise.resolve(bootstrapWallet())
      .finally(() => {
        safeSetWalletState((current) => ({
          ...current,
          initializing: false,
          providerAvailable: Boolean(providerRef.current || getInjectedWalletProvider()),
        }));
      });

    return () => {
      active = false;
      mountedRef.current = false;

      if (typeof window !== 'undefined') {
        window.removeEventListener('ethereum#initialized', handleEthereumInitialized);
      }
    };
  }, []);

  useEffect(() => {
    if (!walletState.account) {
      return undefined;
    }

    const interval = setInterval(() => {
      refreshBalance(walletState.account);
    }, 10000);

    return () => clearInterval(interval);
  }, [walletState.account]);

  useEffect(() => {
    const provider = readProvider();

    if (!provider || typeof provider.on !== 'function') {
      safeSetWalletState((current) => ({
        ...current,
        providerAvailable: Boolean(provider),
      }));
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      const nextAccount = accounts?.[0] || null;

      persistWalletAddress(nextAccount);
      Promise.resolve(syncWalletFromProvider({ disconnectedMessage: 'Wallet disconnected' })).catch((error) => {
        console.error('Wallet account event failed:', error);
      });
    };

    const handleChainChanged = () => {
      Promise.resolve(syncWalletFromProvider()).catch((error) => {
        console.error('Wallet chain event failed:', error);
      });
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      if (typeof provider.removeListener === 'function') {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [providerRevision, walletState.networkConfig.chainId, walletState.networkConfig.chainName]);

  const activeChainId = normalizeChainId(walletState.chainId);
  const targetChainId = normalizeChainId(walletState.networkConfig.chainId);
  const isWrongNetwork =
    Boolean(walletState.account) &&
    Boolean(activeChainId && targetChainId && activeChainId !== targetChainId);
  const isConnected = Boolean(walletState.account);
  const isReady = Boolean(walletState.account && activeChainId && targetChainId && activeChainId === targetChainId);

  const value = {
    ...walletState,
    isConnected,
    isWrongNetwork,
    isReady,
    contractAddress: walletState.tokenMeta.contractAddress,
    explorerBaseUrl:
      walletState.tokenMeta.explorerUrl ||
      walletState.networkConfig.blockExplorerUrls?.[0] ||
      '',
    shortAddress: shortenAddress(walletState.account),
    chainLabel: getChainLabel(walletState.chainId),
    connectWallet,
    switchToSupportedNetwork,
    switchWallet,
    disconnectWallet,
    ensureWalletReady,
    refreshBalance,
    refreshBlockchainConfig,
    syncWalletFromProvider,
    addTokenToMetaMask,
    openInstallWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return context;
}
