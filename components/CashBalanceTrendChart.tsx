"use client";

import { formatAmount } from "@/lib/currency";

interface TrendDataPoint {
  date: string;
  balance: number;
}

interface CashBalanceTrendChartProps {
  data: TrendDataPoint[];
}

export default function CashBalanceTrendChart({ data }: CashBalanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance du Solde (30 jours)</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  // Calculate min and max for scaling
  const balances = data.map((d) => d.balance);
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(...balances, 0);
  const range = maxBalance - minBalance || 1;

  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 100; // percentage
  const padding = 20;

  // Generate SVG path
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = chartHeight - ((point.balance - minBalance) / range) * (chartHeight - padding * 2) - padding;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  // Get color based on trend
  const getTrendColor = () => {
    if (data.length < 2) return "text-gray-600";
    const firstBalance = data[0].balance;
    const lastBalance = data[data.length - 1].balance;
    if (lastBalance > firstBalance) return "text-green-600";
    if (lastBalance < firstBalance) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = () => {
    if (data.length < 2) return null;
    const firstBalance = data[0].balance;
    const lastBalance = data[data.length - 1].balance;
    if (lastBalance > firstBalance) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (lastBalance < firstBalance) {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tendance du Solde (30 jours)</h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {data.length >= 2 && formatAmount(Math.abs(data[data.length - 1].balance - data[0].balance))}
          </span>
        </div>
      </div>

      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          {/* Grid lines */}
          <line x1="0" y1={padding} x2="100" y2={padding} stroke="#e5e7eb" strokeWidth="0.5" />
          <line
            x1="0"
            y1={chartHeight / 2}
            x2="100"
            y2={chartHeight / 2}
            stroke="#e5e7eb"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          <line
            x1="0"
            y1={chartHeight - padding}
            x2="100"
            y2={chartHeight - padding}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />

          {/* Zero line if applicable */}
          {minBalance < 0 && maxBalance > 0 && (
            <line
              x1="0"
              y1={chartHeight - (-minBalance / range) * (chartHeight - padding * 2) - padding}
              x2="100"
              y2={chartHeight - (-minBalance / range) * (chartHeight - padding * 2) - padding}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          )}

          {/* Area under the line */}
          <path
            d={`${pathData} L 100,${chartHeight - padding} L 0,${chartHeight - padding} Z`}
            fill="url(#gradient)"
            opacity="0.2"
          />

          {/* Line */}
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Date labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{formatDate(data[0].date)}</span>
        {data.length > 2 && <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>}
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>

      {/* Balance labels */}
      <div className="flex justify-between mt-4 text-sm">
        <div>
          <p className="text-gray-500">Début</p>
          <p className="font-semibold text-gray-900">{formatAmount(data[0].balance)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Actuel</p>
          <p className={`font-semibold ${getTrendColor()}`}>{formatAmount(data[data.length - 1].balance)}</p>
        </div>
      </div>
    </div>
  );
}
