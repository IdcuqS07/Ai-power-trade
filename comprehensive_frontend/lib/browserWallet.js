const DEFAULT_PROVIDER_WAIT_MS = 2500;
const DEFAULT_PROVIDER_POLL_MS = 125;

function getBrowserWindow(browserWindow) {
  if (browserWindow) {
    return browserWindow;
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  return null;
}

function dedupeProviders(providers) {
  return providers.filter((provider, index) => provider && providers.indexOf(provider) === index);
}

function scoreProvider(provider) {
  if (!provider) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (provider.isMetaMask) {
    score += 100;
  }

  if (provider._metamask) {
    score += 20;
  }

  if (provider.providers) {
    score -= 5;
  }

  if (provider.isCoinbaseWallet) {
    score -= 5;
  }

  if (provider.isBraveWallet) {
    score -= 15;
  }

  if (provider.isRabby) {
    score -= 20;
  }

  if (provider.isPhantom) {
    score -= 20;
  }

  return score;
}

export function getInjectedWalletProviders(browserWindow) {
  const currentWindow = getBrowserWindow(browserWindow);
  const rootProvider = currentWindow?.ethereum;

  if (!rootProvider) {
    return [];
  }

  const providers = Array.isArray(rootProvider.providers) && rootProvider.providers.length
    ? rootProvider.providers
    : [rootProvider];

  return dedupeProviders(providers);
}

export function getInjectedWalletProvider(browserWindow) {
  const currentWindow = getBrowserWindow(browserWindow);
  const providers = getInjectedWalletProviders(currentWindow);

  if (!providers.length) {
    return null;
  }

  return [...providers].sort((left, right) => scoreProvider(right) - scoreProvider(left))[0] || null;
}

export function waitForInjectedWalletProvider({
  browserWindow,
  timeoutMs = DEFAULT_PROVIDER_WAIT_MS,
  pollIntervalMs = DEFAULT_PROVIDER_POLL_MS,
} = {}) {
  const currentWindow = getBrowserWindow(browserWindow);
  const immediateProvider = getInjectedWalletProvider(currentWindow);

  if (immediateProvider || !currentWindow) {
    return Promise.resolve(immediateProvider);
  }

  return new Promise((resolve) => {
    let resolved = false;
    let timeoutId = null;
    let pollId = null;

    const finish = (provider) => {
      if (resolved) {
        return;
      }

      resolved = true;

      if (timeoutId) {
        currentWindow.clearTimeout(timeoutId);
      }

      if (pollId) {
        currentWindow.clearInterval(pollId);
      }

      currentWindow.removeEventListener('ethereum#initialized', handleReady);
      resolve(provider || null);
    };

    const handleReady = () => {
      const provider = getInjectedWalletProvider(currentWindow);

      if (provider) {
        finish(provider);
      }
    };

    currentWindow.addEventListener('ethereum#initialized', handleReady, { once: true });
    pollId = currentWindow.setInterval(handleReady, pollIntervalMs);
    timeoutId = currentWindow.setTimeout(() => finish(getInjectedWalletProvider(currentWindow)), timeoutMs);
  });
}
