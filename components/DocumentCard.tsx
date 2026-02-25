"use client";

import { useState, useEffect } from "react";
import { Document, DocumentStatus, DocumentType } from "@/types";
import { formatAmount } from "@/lib/currency";

interface PaymentHistoryItem {
  justification: {
    id: string;
    date: Date;
    amount: number;
    category: string;
    reference?: string;
    note?: string;
  };
  disbursement: {
    id: string;
    initialAmount: number;
    remainingAmount: number;
    status: string;
  };
}

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export default function DocumentCard({ document, onView, onEdit, onDelete }: DocumentCardProps) {
  const { type, reference, totalAmount, paidAmount, remainingAmount, status, dueDate } = document;
  const [isExpanded, setIsExpanded] = useState(false);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Calculate progress percentage
  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Check if overdue
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== DocumentStatus.PAID;

  // Enhanced color system
  const getStatusColors = (status: DocumentStatus) => {
    const colorMap = {
      UNPAID: {
        bg: "from-red-50 to-red-100/50",
        border: "border-red-200",
        accent: "bg-red-500",
        text: "text-red-800",
        badge: "bg-red-100 text-red-800",
        progress: "from-red-400 to-red-600"
      },
      PARTIALLY_PAID: {
        bg: "from-amber-50 to-amber-100/50",
        border: "border-amber-200",
        accent: "bg-amber-500",
        text: "text-amber-800",
        badge: "bg-amber-100 text-amber-800",
        progress: "from-amber-400 to-amber-600"
      },
      PAID: {
        bg: "from-emerald-50 to-emerald-100/50",
        border: "border-emerald-200",
        accent: "bg-emerald-500",
        text: "text-emerald-800",
        badge: "bg-emerald-100 text-emerald-800",
        progress: "from-emerald-400 to-emerald-600"
      }
    };
    return colorMap[status];
  };

  const statusColors = getStatusColors(status);

  // Get document type icon with enhanced styling
  const getTypeIcon = (type: DocumentType): { icon: string; bg: string; text: string } => {
    const typeMap: Record<DocumentType, { icon: string; bg: string; text: string }> = {
      INVOICE: { icon: "📄", bg: "bg-blue-100", text: "text-blue-700" },
      PAYSLIP: { icon: "💰", bg: "bg-green-100", text: "text-green-700" },
      PURCHASE_ORDER: { icon: "🛒", bg: "bg-purple-100", text: "text-purple-700" },
      CONTRACT: { icon: "📋", bg: "bg-indigo-100", text: "text-indigo-700" },
      OTHER: { icon: "📎", bg: "bg-gray-100", text: "text-gray-700" },
    };
    return typeMap[type];
  };

  const typeInfo = getTypeIcon(type);

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

  // Get status label
  const getStatusLabel = (status: DocumentStatus): string => {
    const labels: Record<DocumentStatus, string> = {
      UNPAID: "Non payé",
      PARTIALLY_PAID: "Partiellement payé",
      PAID: "Payé",
    };
    return labels[status];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("fr-FR");
  };

  // Fetch payment details when expanding
  const fetchPaymentDetails = async () => {
    if (isLoadingPayments || payments.length > 0) return;

    setIsLoadingPayments(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Handle card expansion
  const toggleExpansion = () => {
    if (!isExpanded && paidAmount > 0) {
      fetchPaymentDetails();
    }
    setIsExpanded(!isExpanded);
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      TRAVEL: "bg-blue-100 text-blue-800",
      MEAL: "bg-orange-100 text-orange-800",
      ACCOMMODATION: "bg-purple-100 text-purple-800",
      EQUIPMENT: "bg-gray-100 text-gray-800",
      MISCELLANEOUS: "bg-indigo-100 text-indigo-800",
      CASH_RETURN: "bg-red-100 text-red-800",
    };
    return categoryColors[category] || "bg-gray-100 text-gray-800";
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      TRAVEL: "Déplacement",
      MEAL: "Repas",
      ACCOMMODATION: "Hébergement",
      EQUIPMENT: "Équipement",
      MISCELLANEOUS: "Divers",
      CASH_RETURN: "Retour caisse",
    };
    return categoryLabels[category] || category;
  };

  return (
    <div className={`group relative overflow-hidden transition-all duration-500 ease-out ${
      isExpanded ? 'col-span-full' : ''
    }`}>
      <div
        className={`
          relative bg-gradient-to-br ${statusColors.bg} backdrop-blur-sm
          border-2 ${statusColors.border} rounded-xl shadow-sm
          transition-all duration-500 ease-out transform
          ${isExpanded
            ? 'shadow-xl shadow-black/5 scale-[1.02]'
            : 'hover:shadow-md hover:shadow-black/5 hover:scale-[1.01]'
          }
          ${isOverdue ? 'ring-2 ring-red-200 ring-opacity-50' : ''}
        `}
      >
        {/* Status accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${statusColors.accent} rounded-t-xl`} />

        {/* Main card content */}
        <div className="relative p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} ${typeInfo.text} flex items-center justify-center text-lg font-medium shadow-sm`}>
                  {typeInfo.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
                    {reference}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{getTypeLabel(type)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors.badge} shadow-sm`}>
                {getStatusLabel(status)}
              </span>
              {paidAmount > 0 && (
                <button
                  onClick={toggleExpansion}
                  className={`
                    flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg
                    bg-white/60 hover:bg-white/80 border border-white/40
                    transition-all duration-200 shadow-sm hover:shadow-md
                    ${statusColors.text}
                  `}
                >
                  <span>{isExpanded ? 'Moins' : 'Détails'}</span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Overdue Warning */}
          {isOverdue && (
            <div className="mb-4 p-3 bg-red-100/80 border border-red-200 rounded-lg text-xs text-red-700 font-medium backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-red-500">⚠️</span>
                <span>En retard depuis le {formatDate(dueDate!)}</span>
              </div>
            </div>
          )}

          {/* Amounts Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(totalAmount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Restant</p>
              <p className={`text-lg font-bold ${remainingAmount > 0 ? statusColors.text : 'text-gray-400'}`}>
                {formatAmount(remainingAmount)}
              </p>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Progression</p>
              <p className="text-sm font-bold text-gray-700">{Math.round(progress)}%</p>
            </div>
            <div className="relative w-full bg-gray-200/60 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${statusColors.progress} transition-all duration-1000 ease-out rounded-full relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Due Date */}
          {dueDate && (
            <div className="mb-4 pb-4 border-b border-gray-200/60">
              <p className="text-xs text-gray-500">
                Échéance:{" "}
                <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatDate(dueDate)}
                </span>
              </p>
            </div>
          )}

          {/* Payment Details (Expanded State) */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-200/60 space-y-4 animate-in slide-in-from-top-2 duration-500">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                Historique des Paiements
              </h4>

              {isLoadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    Chargement...
                  </div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  Aucun paiement enregistré
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {payments.map((payment, index) => (
                    <div
                      key={payment.justification.id}
                      className="group/payment relative p-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: `slideIn 0.4s ease-out forwards`
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getCategoryColor(payment.justification.category)}`}>
                              {getCategoryLabel(payment.justification.category)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(payment.justification.date)}
                            </span>
                          </div>

                          {payment.justification.reference && (
                            <p className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">Réf:</span> {payment.justification.reference}
                            </p>
                          )}

                          {payment.justification.note && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {payment.justification.note}
                            </p>
                          )}

                          <a
                            href={`/disbursements/${payment.disbursement.id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors group/link"
                          >
                            <span>Voir décaissement</span>
                            <svg className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-base font-bold text-blue-600">
                            {formatAmount(payment.justification.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {onView && (
              <button
                onClick={() => onView(document)}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Voir
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(document)}
                className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(document)}
                className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={status !== DocumentStatus.UNPAID}
              >
                Supprimer
              </button>
            )}
          </div>

          {/* Fully Paid Celebration */}
          {status === DocumentStatus.PAID && (
            <div className="text-center py-3 text-sm text-emerald-600 font-medium mt-4 bg-emerald-50/50 rounded-lg border border-emerald-200/50">
              <span className="inline-flex items-center gap-1">
                ✓ Payé intégralement
                <span className="text-emerald-400">🎉</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-top-2 {
          animation: slideInFromTop 0.4s ease-out;
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}