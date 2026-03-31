// Approximate exchange rates to USD (updated periodically)
// Replace with a live API (e.g., Open Exchange Rates) for production accuracy
const RATES_TO_USD = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.26,
  AUD: 0.65,
  CAD: 0.74,
  JPY: 0.0067,
  BRL: 0.20,
  MXN: 0.058,
  CHF: 1.12,
  SEK: 0.096,
  NOK: 0.094,
  DKK: 0.145,
  NZD: 0.60,
  SGD: 0.74,
  HKD: 0.13,
  INR: 0.012,
  PLN: 0.25,
  CZK: 0.043,
  ZAR: 0.055,
  AED: 0.27,
  SAR: 0.27,
  PHP: 0.018,
  THB: 0.028,
  MYR: 0.22,
  IDR: 0.000063,
  KRW: 0.00075,
  TWD: 0.031,
  CLP: 0.0011,
  COP: 0.00025,
  PEN: 0.27,
  ARS: 0.0012,
  ILS: 0.28,
  TRY: 0.031,
  RON: 0.22,
  HUF: 0.0027,
  BGN: 0.55,
  HRK: 0.14,
  RUB: 0.011,
  CNY: 0.14,
};

function convertToUsd(amount, currency) {
  if (!amount || !currency) return amount || 0;
  const code = currency.toUpperCase().trim();
  const rate = RATES_TO_USD[code];
  if (!rate) {
    console.warn(`Unknown currency "${currency}", treating as USD`);
    return amount;
  }
  return Math.round(amount * rate * 100) / 100;
}

module.exports = { convertToUsd, RATES_TO_USD };
