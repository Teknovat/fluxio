"use client";

import { Advance, AdvanceStatus } from "@/types";
import { formatAmount } from "@/lib/currency";

interface AdvanceWithRemaining extends Advance {
  remaining: number;
}

interface AdvanceCardProps {
  advance: AdvanceWithRemaining;
  onReimburse: (advance: AdvanceWithRemaining) => void;
}

export default function AdvanceCard({ advance, onReimburse }: AdvanceCardProps) {
  const { intervenant, amount, remaining, status, dueDate, createdAt, mouvement } = advance;

  // Calculate progress percentage
  const reimbursed = amount - remaining;
  const progress = (reimbursed / amount) * 100;

  // Calculate days since advance
  const getDaysSince = (date: Date): number => {
    const now = new Date();
    const advanceDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - advanceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSince = getDaysSince(mouvement?.date || createdAt);

  // Check if overdue
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== AdvanceStatus.REMBOURSE_TOTAL;

  // Get status label and color
  const getStatusLabel = (status: AdvanceStatus): string => {
    const labels: Record<AdvanceStatus, string> = {
      EN_COURS: "En cours",
      REMBOURSE_PARTIEL: "Remboursé partiellement",
      REMBOURSE_TOTAL: "Remboursé totalement",
    };
    return labels[status];
  };

  const getStatusColor = (status: AdvanceStatus): string => {
    const colors: Record<AdvanceStatus, string> = {
      EN_COURS: "bg-yellow-100 text-yellow-800",
      REMBOURSE_PARTIEL: "bg-blue-100 text-blue-800",
      REMBOURSE_TOTAL: "bg-green-100 text-green-800",
    };
    return colors[status];
  };

  const getBorderColor = (): string => {
    if (isOverdue) return "border-red-500";
    if (status === AdvanceStatus.REMBOURSE_TOTAL) return "border-green-300";
    if (status === AdvanceStatus.REMBOURSE_PARTIEL) return "border-blue-300";
    return "border-yellow-300";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow border-2 ${getBorderColor()} ${
        isOverdue ? "bg-red-50" : ""
      } transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{intervenant?.name || "N/A"}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(mouvement?.date || createdAt)} • {daysSince} jour{daysSince !== 1 ? "s" : ""}
          </p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 font-medium">
          ⚠️ En retard depuis le {formatDate(dueDate!)}
        </div>
      )}

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Montant initial</p>
          <p className="text-sm font-medium text-gray-900">{formatAmount(amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Restant</p>
          <p className="text-sm font-bold text-red-600">{formatAmount(remaining)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-500">Progression</p>
          <p className="text-xs font-medium text-gray-700">{Math.round(progress)}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              status === AdvanceStatus.REMBOURSE_TOTAL
                ? "bg-green-600"
                : status === AdvanceStatus.REMBOURSE_PARTIEL
                ? "bg-blue-600"
                : "bg-yellow-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Due Date */}
      {dueDate && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            Échéance:{" "}
            <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-700"}>{formatDate(dueDate)}</span>
          </p>
        </div>
      )}

      {/* Action Button */}
      {status !== AdvanceStatus.REMBOURSE_TOTAL && (
        <button
          onClick={() => onReimburse(advance)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Rembourser
        </button>
      )}

      {/* Fully Reimbursed Message */}
      {status === AdvanceStatus.REMBOURSE_TOTAL && (
        <div className="text-center py-2 text-sm text-green-600 font-medium">✓ Remboursé totalement</div>
      )}
    </div>
  );
}
