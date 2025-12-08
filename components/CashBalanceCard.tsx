"use client";

import { formatAmount } from "@/lib/currency";

interface CashBalanceCardProps {
  balance: number;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function CashBalanceCard({ balance, lastUpdated, onRefresh, isLoading }: CashBalanceCardProps) {
  const getBalanceColor = () => {
    if (balance > 1000) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-yellow-600";
  };

  const getBalanceStatus = () => {
    if (balance > 1000) return "Solde positif";
    if (balance < 0) return "Solde négatif";
    return "Solde faible";
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const date = new Date(lastUpdated);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-600 mb-1">Solde de Caisse</h2>
          <p className="text-sm text-gray-500">{getBalanceStatus()}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <svg
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className={`text-5xl font-bold ${getBalanceColor()}`}>{formatAmount(Math.abs(balance))}</p>
      </div>

      {lastUpdated && (
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Mis à jour: {formatLastUpdated()}
        </div>
      )}
    </div>
  );
}
