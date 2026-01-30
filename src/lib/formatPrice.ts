/**
 * Format price with thousands separator and currency symbol.
 * UAH: 12 500 UAH, EUR: 290 EUR
 */
export function formatPriceUAH(amount: number): string {
  return `${amount.toLocaleString("uk-UA")} UAH`;
}

export function formatPriceEUR(amount: number): string {
  return `${amount.toLocaleString("de-DE")} EUR`;
}

export function formatPriceDual(priceUAH: number, priceEUR: number): string {
  return `${priceUAH.toLocaleString("uk-UA")} UAH / ${priceEUR.toLocaleString("de-DE")} EUR`;
}
