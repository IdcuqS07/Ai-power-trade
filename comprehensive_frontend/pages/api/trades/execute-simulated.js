const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim();

function buildLocalFallback(body = {}, message = 'Trade saved in local preview mode', backendData = {}) {
  return {
    success: true,
    trade_id: `SIM-${Date.now()}`,
    message,
    tx_hash: null,
    record_hash: null,
    data: {
      symbol: body.symbol,
      trade_type: body.trade_type,
      amount: body.amount,
      price: body.price,
      timestamp: new Date().toISOString(),
      validation_status: 'Preview mode',
      settlement_status: 'Preview only',
      execution_mode: 'preview_local',
      provider_label: 'Local Preview',
      ...backendData,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      symbol,
      trade_type,
      amount,
      price,
      wallet_address,
      execution_provider,
      sodex_signed_order,
    } = req.body;
    const liveExecutionRequested = execution_provider === 'sodex' || Boolean(sodex_signed_order);

    if (!symbol || !trade_type || !amount || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: symbol, trade_type, amount, price',
      });
    }

    console.log('Simulated trade request:', {
      symbol,
      trade_type,
      amount,
      price,
      wallet_address,
      execution_provider,
      liveExecutionRequested,
    });

    const backendTimeoutMs = liveExecutionRequested ? 12000 : 5000;
    const backendResponse = await fetch(`${API_URL}/api/trades/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(backendTimeoutMs),
      body: JSON.stringify(req.body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend API error:', errorText);

      if (liveExecutionRequested) {
        return res.status(backendResponse.status).json({
          success: false,
          message: errorText || 'SoDEX live execution failed',
        });
      }

      return res.status(200).json(
        buildLocalFallback(req.body, 'Trade saved locally (live execution unavailable)')
      );
    }

    const result = await backendResponse.json();
    console.log('Backend response:', result);

    if (result?.success === false) {
      return res.status(200).json({
        success: false,
        message: result.reason || result.message || 'Trade request was rejected during validation',
        data: result,
      });
    }

    const trade = result?.trade || {};
    const onChainRecord = result?.on_chain_record || {};
    const validation = result?.validation || {};
    const settlement = result?.settlement || {};
    const oracleVerification = result?.oracle_verification || {};
    const providerSource = String(result?.execution_provider || settlement?.source || '').trim();
    const isSodexExecution = providerSource.toLowerCase() === 'sodex';
    const executionMode = isSodexExecution
      ? 'sodex_live'
      : result?.preview_only
        ? 'preview_backend'
        : 'internal_fallback';
    const providerLabel = isSodexExecution
      ? 'SoDEX Testnet'
      : settlement?.source
        ? String(settlement.source)
        : result?.preview_only
          ? 'Backend Preview'
          : 'Internal Fallback';

    return res.status(200).json({
      success: true,
      trade_id: trade.trade_id || result.trade_id || `SIM-${Date.now()}`,
      message:
        result.message ||
        (isSodexExecution
          ? 'SoDEX order submitted successfully.'
          : oracleVerification.is_verified
            ? 'Trade request completed and passed runtime checks.'
            : 'Trade request completed through the internal fallback route.'),
      tx_hash: trade.tx_hash || null,
      record_hash: onChainRecord.block_hash || null,
      data: {
        ...result,
        validation_status: validation.is_valid ? 'Passed' : validation.validations?.length ? 'Review' : 'Unknown',
        settlement_status: settlement.status || 'Submitted',
        execution_mode: executionMode,
        provider_label: providerLabel,
        record_hash: onChainRecord.block_hash || null,
      },
    });
  } catch (error) {
    console.error('Simulated trade error:', error);

    if (req.body?.execution_provider === 'sodex' || req.body?.sodex_signed_order) {
      return res.status(500).json({
        success: false,
        message: error.message || 'SoDEX live execution failed',
      });
    }

    return res.status(200).json(buildLocalFallback(req.body));
  }
}
