import { formatCurrency, type Currency } from "./currency";

/**
 * Formate un prix avec la devise et les options d'affichage
 */
export function formatPrice(
  amount: number | null | undefined,
  currency: Currency = "EUR",
  options: {
    showPerNight?: boolean;
    showCurrency?: boolean;
    compact?: boolean;
  } = {}
): string {
  if (amount === null || amount === undefined) {
    return "—";
  }

  const {
    showPerNight = false,
    showCurrency = true,
    compact = false,
  } = options;

  if (!showCurrency) {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: currency === "XOF" ? 0 : 2,
      maximumFractionDigits: currency === "XOF" ? 0 : 2,
    }).format(amount);
  }

  const formattedPrice = formatCurrency(amount, currency);

  if (compact && showPerNight) {
    return `${formattedPrice}/nuit`;
  }

  if (showPerNight) {
    return `${formattedPrice} / nuit`;
  }

  return formattedPrice;
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR").format(value);
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Raccourcit un montant pour l'affichage (1K, 1M, etc.)
 */
export function formatCompactCurrency(
  amount: number | null | undefined,
  currency: Currency = "EUR"
): string {
  if (amount === null || amount === undefined) {
    return "—";
  }

  const formatter = new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  const compactNumber = formatter.format(amount);
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "CFA";

  if (currency === "USD") {
    return `${symbol}${compactNumber}`;
  } else {
    return `${compactNumber} ${symbol}`;
  }
}
