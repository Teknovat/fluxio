"use client";

import { Disbursement, DisbursementStatus } from "@/types";
import { formatAmount } from "@/lib/currency";
import { getDaysOutstanding, isDisbursementOverdue } from "@/lib/disbursement-calculations";

interface DisbursementWithRemaining extends Disbursement {
  remaining: number;
}

interface DisbursementCardProps {
  disbursement: DisbursementWithRemaining;
  onJustify: (disbursement: DisbursementWithRemaining) => void;
  onReturn: (disbursement: DisbursementWithRemaining) => void;
}

export default function DisbursementCard({ disbursement, onJustify, onReturn }: DisbursementCardProps) {
  const { intervenant, initialAmount, remaining, status, dueDate, createdAt, mouvement } = disbursement;

  // Calculate progress percentage
  const justified = initialAmount - remaining;
  const progress = (justified / initialAmount) * 100;

  const daysOutstanding = getDaysOutstanding(disbursement);
  const isOverdue = isDisbursementOverdue(disbursement);

  // Get status label and color
  const getStatusLabel = (status: DisbursementStatus): string => {
    const labels: Record<DisbursementStatus, string> = {
      OPEN: "Ouvert",
      PARTIALLY_JUSTIFIED: "Partiellement justifié",
      JUSTIFIED: "Justifié",
    };
    return labels[status];
  };

  const getStatusColor = (status: DisbursementStatus): string => {
    const colors: Record<DisbursementStatus, string> = {
      OPEN: "bg-yellow-100 text-yellow-800",
      PARTIALLY_JUSTIFIED: "bg-blue-100 text-blue-800",
      JUSTIFIED: "bg-green-100 text-green-800",
    };
    return colors[status];
  };

  const getBorderColor = (): string => {
    if (isOverdue) return "border-red-500";
    if (status === DisbursementStatus.JUSTIFIED) return "border-green-300";
    if (status === DisbursementStatus.PARTIALLY_JUSTIFIED) return "border-blue-300";
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
            {formatDate(mouvement?.date || createdAt)} • {daysOutstanding} jour{daysOutstanding !== 1 ? "s" : ""}
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
          <p className="text-sm font-medium text-gray-900">{formatAmount(initialAmount)}</p>
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
              status === DisbursementStatus.JUSTIFIED
                ? "bg-green-600"
                : status === DisbursementStatus.PARTIALLY_JUSTIFIED
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

      {/* Action Buttons */}
      {status !== DisbursementStatus.JUSTIFIED && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onJustify(disbursement)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Justifier
          </button>
          <button
            onClick={() => onReturn(disbursement)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Retour caisse
          </button>
        </div>
      )}

      {/* Fully Justified Message */}
      {status === DisbursementStatus.JUSTIFIED && (
        <div className="text-center py-2 text-sm text-green-600 font-medium">✓ Justifié totalement</div>
      )}
    </div>
  );
}
