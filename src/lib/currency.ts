export type Currency = "EUR" | "USD" | "XOF";

export const currencyConfig = {
  EUR: {
    symbol: "€",
    name: "Euro",
    position: "after" as const,
    decimalPlaces: 2,
  },
  USD: {
    symbol: "$",
    name: "Dollar US",
    position: "before" as const,
    decimalPlaces: 2,
  },
  XOF: {
    symbol: "CFA",
    name: "Franc CFA",
    position: "after" as const,
    decimalPlaces: 0,
  },
};

export function formatCurrency(
  amount: number | null | undefined,
  currency: Currency = "EUR"
): string {
  if (amount === null || amount === undefined) {
    return "—";
  }

  const config = currencyConfig[currency];

  // Formater le nombre selon la devise
  const formattedNumber = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount);

  // Ajouter le symbole selon la position
  if (config.position === "before") {
    return `${config.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${config.symbol}`;
  }
}

export function getCurrencySymbol(currency: Currency = "EUR"): string {
  return currencyConfig[currency].symbol;
}

export function getCurrencyName(currency: Currency = "EUR"): string {
  return currencyConfig[currency].name;
}

export const currencyOptions = [
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "USD", label: "Dollar US ($)", symbol: "$" },
  { value: "XOF", label: "Franc CFA (CFA)", symbol: "CFA" },
];
