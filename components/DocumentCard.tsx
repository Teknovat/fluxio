"use client";

import { Document, DocumentStatus, DocumentType } from "@/types";
import { formatAmount } from "@/lib/currency";

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export default function DocumentCard({ document, onView, onEdit, onDelete }: DocumentCardProps) {
  const { type, reference, intervenant, totalAmount, paidAmount, remainingAmount, status, dueDate, issueDate } =
    document;

  // Calculate progress percentage
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Check if overdue
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== DocumentStatus.PAID;

  // Get document type icon
  const getTypeIcon = (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
      INVOICE: "📄",
      PAYSLIP: "💰",
      PURCHASE_ORDER: "🛒",
      CONTRACT: "📋",
      OTHER: "📎",
    };
    return icons[type];
  };

  // Get document type label
  const getTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      INVOICE: "Facture",
      PAYSLIP: "Bulletin de salaire",
      PURCHASE_ORDER: "Bon de commande",
      CONTRACT: "Contrat",
      OTHER: "Autre",
    };
    return labels[type];
  };

  // Get status label and color
  const getStatusLabel = (status: DocumentStatus): string => {
    const labels: Record<DocumentStatus, string> = {
      UNPAID: "Non payé",
      PARTIALLY_PAID: "Partiellement payé",
      PAID: "Payé",
    };
    return labels[status];
  };

  const getStatusColor = (status: DocumentStatus): string => {
    const colors: Record<DocumentStatus, string> = {
      UNPAID: "bg-red-100 text-red-800",
      PARTIALLY_PAID: "bg-blue-100 text-blue-800",
      PAID: "bg-green-100 text-green-800",
    };
    return colors[status];
  };

  const getBorderColor = (): string => {
    if (isOverdue) return "border-red-500";
    if (status === DocumentStatus.PAID) return "border-green-300";
    if (status === DocumentStatus.PARTIALLY_PAID) return "border-blue-300";
    return "border-red-300";
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getTypeIcon(type)}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{reference}</h3>
              <p className="text-xs text-gray-500">{getTypeLabel(type)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{intervenant?.name || "N/A"}</p>
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
          <p className="text-xs text-gray-500 mb-1">Montant total</p>
          <p className="text-sm font-medium text-gray-900">{formatAmount(totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Restant</p>
          <p className="text-sm font-bold text-red-600">{formatAmount(remainingAmount)}</p>
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
              status === DocumentStatus.PAID
                ? "bg-green-600"
                : status === DocumentStatus.PARTIALLY_PAID
                ? "bg-blue-600"
                : "bg-red-600"
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
      <div className="grid grid-cols-3 gap-2">
        {onView && (
          <button
            onClick={() => onView(document)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Voir
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(document)}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Modifier
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(document)}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={status !== DocumentStatus.UNPAID}
          >
            Supprimer
          </button>
        )}
      </div>

      {/* Fully Paid Message */}
      {status === DocumentStatus.PAID && (
        <div className="text-center py-2 text-sm text-green-600 font-medium mt-2">✓ Payé totalement</div>
      )}
    </div>
  );
}
