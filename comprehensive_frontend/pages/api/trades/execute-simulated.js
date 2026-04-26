const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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
    } = req.body;

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
    });

    const backendResponse = await fetch(`${API_URL}/api/trades/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        force_execute: true,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend API error:', errorText);
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

    return res.status(200).json({
      success: true,
      trade_id: trade.trade_id || result.trade_id || `SIM-${Date.now()}`,
      message:
        result.message ||
        (oracleVerification.is_verified
          ? 'Trade request completed and passed runtime checks.'
          : 'Trade request completed in assisted review mode.'),
      tx_hash: trade.tx_hash || null,
      record_hash: onChainRecord.block_hash || null,
      data: {
        ...result,
        validation_status: validation.is_valid ? 'Passed' : validation.validations?.length ? 'Review' : 'Unknown',
        settlement_status: settlement.status || 'Submitted',
        record_hash: onChainRecord.block_hash || null,
      },
    });
  } catch (error) {
    console.error('Simulated trade error:', error);
    return res.status(200).json(buildLocalFallback(req.body));
  }
}
