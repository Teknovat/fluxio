"use client";

import { IntervenantBalance } from "@/types";
import { formatAmount } from "@/lib/currency";

interface BalanceCardProps {
  balance: IntervenantBalance;
  onClick: () => void;
}

export default function BalanceCard({ balance, onClick }: BalanceCardProps) {
  const { intervenant, totalEntries, totalExits, balance: balanceAmount, movementCount } = balance;

  // Determine color based on balance
  // Positive balance = intervenant owes company (red/debt)
  // Negative balance = company owes intervenant (green/credit)
  // Zero balance = gray
  const getBalanceColor = () => {
    if (balanceAmount > 0) return "text-red-600";
    if (balanceAmount < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getBorderColor = () => {
    if (balanceAmount > 0) return "border-red-200 hover:border-red-300";
    if (balanceAmount < 0) return "border-green-200 hover:border-green-300";
    return "border-gray-200 hover:border-gray-300";
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      CLIENT: "Client",
      FOURNISSEUR: "Fournisseur",
      ASSOCIE: "Associé",
      COLLABORATEUR: "Collaborateur",
      CAISSE_BANQUE: "Caisse/Banque",
      AUTRE: "Autre",
    };
    return labels[type] || type;
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white p-4 rounded-lg shadow border-2 ${getBorderColor()} transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{intervenant.name}</h3>
          <p className="text-sm text-gray-500">{getTypeLabel(intervenant.type)}</p>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Solde</p>
        <p className={`text-2xl font-bold ${getBalanceColor()}`}>{formatAmount(Math.abs(balanceAmount))}</p>
        {balanceAmount > 0 && <p className="text-xs text-red-600 mt-1">Dette envers la société</p>}
        {balanceAmount < 0 && <p className="text-xs text-green-600 mt-1">Crédit de la société</p>}
        {balanceAmount === 0 && <p className="text-xs text-gray-500 mt-1">Compte équilibré</p>}
      </div>

      {/* Entries and Exits */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Entrées</p>
          <p className="text-sm font-medium text-green-600">{formatAmount(totalEntries)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Sorties</p>
          <p className="text-sm font-medium text-red-600">{formatAmount(totalExits)}</p>
        </div>
      </div>

      {/* Movement Count */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {movementCount} mouvement{movementCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
