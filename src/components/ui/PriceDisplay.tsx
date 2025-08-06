import { formatCurrency, type Currency } from "@/lib/currency";

interface PriceDisplayProps {
  amount: number | null | undefined;
  currency: Currency;
  className?: string;
  showPerNight?: boolean;
}

export function PriceDisplay({
  amount,
  currency,
  className = "",
  showPerNight = false,
}: PriceDisplayProps) {
  if (amount === null || amount === undefined) {
    return <span className={className}>—</span>;
  }

  const formattedPrice = formatCurrency(amount, currency);
  const suffix = showPerNight ? " / nuit" : "";

  return (
    <span className={className}>
      {formattedPrice}
      {suffix}
    </span>
  );
}
