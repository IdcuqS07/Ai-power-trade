const createUsdFormatter = (fractionDigits) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const usdWholeFormatter = createUsdFormatter(0);
const usdTwoDecimalFormatter = createUsdFormatter(2);
const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export function formatUsd(value, options = {}) {
  const amount = Number(value ?? 0);
  const digits =
    options.fractionDigits ??
    (Math.abs(amount) >= 1000 ? 0 : 2);

  const formatter = digits === 0 ? usdWholeFormatter : usdTwoDecimalFormatter;

  return formatter.format(amount);
}

export function formatInteger(value) {
  return integerFormatter.format(Number(value ?? 0));
}
