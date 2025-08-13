"use client";

import {
  getCurrencySymbol,
  getCurrencyName,
  type Currency,
} from "@/lib/currency";
import { Coins } from "lucide-react";

interface CurrencyIndicatorProps {
  currency: Currency;
  className?: string;
  showName?: boolean;
}

export function CurrencyIndicator({
  currency,
  className = "",
  showName = false,
}: CurrencyIndicatorProps) {
  const symbol = getCurrencySymbol(currency);
  const name = getCurrencyName(currency);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Coins className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">
        {symbol}
        {showName && ` ${name}`}
      </span>
    </div>
  );
}
