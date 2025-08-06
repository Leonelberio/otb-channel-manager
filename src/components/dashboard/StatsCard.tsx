"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatCompactCurrency } from "@/lib/format";
import { type Currency } from "@/lib/currency";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | null;
  currency?: Currency;
  previousValue?: number | null;
  icon?: React.ReactNode;
  showTrend?: boolean;
  compact?: boolean;
  className?: string;
  isMonetary?: boolean;
}

export function StatsCard({
  title,
  value,
  currency = "EUR",
  previousValue,
  icon,
  showTrend = false,
  compact = false,
  className = "",
  isMonetary = false,
}: StatsCardProps) {
  const getTrendInfo = () => {
    if (!showTrend || !previousValue || !value) {
      return null;
    }

    const change = value - previousValue;
    const changePercent = (change / previousValue) * 100;
    const isPositive = change > 0;
    const isNeutral = change === 0;

    return {
      change,
      changePercent,
      isPositive,
      isNeutral,
      icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown,
      color: isNeutral
        ? "text-gray-500"
        : isPositive
        ? "text-green-600"
        : "text-red-600",
    };
  };

  const trendInfo = getTrendInfo();

  const formattedValue = isMonetary
    ? compact
      ? formatCompactCurrency(value, currency)
      : formatPrice(value, currency)
    : value?.toLocaleString("fr-FR") || "—";

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{formattedValue}</div>

        {trendInfo && (
          <div className={`flex items-center text-xs ${trendInfo.color} mt-1`}>
            <trendInfo.icon className="h-3 w-3 mr-1" />
            <span>
              {trendInfo.isNeutral
                ? "Pas de changement"
                : `${
                    trendInfo.isPositive ? "+" : ""
                  }${trendInfo.changePercent.toFixed(1)}%`}
            </span>
            {!trendInfo.isNeutral && isMonetary && (
              <span className="text-gray-500 ml-1">
                ({trendInfo.isPositive ? "+" : ""}
                {formatPrice(trendInfo.change, currency, { compact: true })})
              </span>
            )}
            {!trendInfo.isNeutral && !isMonetary && (
              <span className="text-gray-500 ml-1">
                ({trendInfo.isPositive ? "+" : ""}
                {trendInfo.change.toLocaleString("fr-FR")})
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
