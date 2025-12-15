"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Document, DocumentStatus, DocumentType, Justification, Disbursement, Intervenant } from "@/types";
import { formatAmount } from "@/lib/currency";
import Toast from "@/components/Toast";
import DocumentForm from "@/components/DocumentForm";

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
  intervenant: {
    id: string;
    name: string;
    type: string;
  };
}

interface DocumentDetailResponse {
  document: Document;
  payments: PaymentHistoryItem[];
  paymentPercentage: number;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [data, setData] = useState<DocumentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const responseData = await response.json();
        setData(responseData);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors du chargement du document", "error");
        if (response.status === 404) {
          setTimeout(() => router.push("/documents"), 2000);
        }
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      showToast("Erreur lors du chargement du document", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("Document supprimé avec succès", "success");
        setTimeout(() => router.push("/documents"), 1500);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

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
      PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
    };
    return colors[status];
  };

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

  const getTypeIcon = (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
      INVOICE: "📄",
      PAYSLIP: "💰",
      PURCHASE_ORDER: "📦",
      CONTRACT: "📋",
      OTHER: "📝",
    };
    return icons[type];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || !data.document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Document non trouvé</p>
        <button
          onClick={() => router.push("/documents")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const { document, payments, paymentPercentage } = data;
  const isOverdue =
    document.dueDate && new Date(document.dueDate) < new Date() && document.status !== DocumentStatus.PAID;

  // Calculate days overdue
  let daysOverdue = 0;
  if (isOverdue && document.dueDate) {
    const now = new Date();
    const due = new Date(document.dueDate);
    const diffTime = Math.abs(now.getTime() - due.getTime());
    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/documents")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Retour à la liste
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Détails du Document</h1>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(document.status)}`}>
          {getStatusLabel(document.status)}
        </span>
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>⚠️ Document en retard</strong> - Échéance dépassée de {daysOverdue} jour
                {daysOverdue !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Header Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getTypeIcon(document.type)}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{document.reference}</h2>
                <p className="text-sm text-gray-500">{getTypeLabel(document.type)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Intervenant */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Intervenant</p>
              <p className="text-lg font-semibold text-gray-900">{document.intervenant?.name || "N/A"}</p>
              <p className="text-xs text-gray-500">{document.intervenant?.type || ""}</p>
            </div>

            {/* Issue Date */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Date d&apos;émission</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(document.issueDate)}</p>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Date d&apos;échéance</p>
              <p className={`text-lg font-semibold ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
                {document.dueDate ? formatDate(document.dueDate) : "Non définie"}
              </p>
              {isOverdue && (
                <p className="text-xs text-red-600 mt-1">
                  En retard de {daysOverdue} jour{daysOverdue !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Created At */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Créé le</p>
              <p className="text-sm text-gray-900">{formatDateTime(document.createdAt)}</p>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
              <p className="text-sm text-gray-700">{document.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Statistics Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Statistiques de Paiement</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Amount */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Montant total</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(document.totalAmount)}</p>
            </div>

            {/* Paid Amount */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Montant payé</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(document.paidAmount)}</p>
            </div>

            {/* Remaining Amount */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Montant restant</p>
              <p className="text-2xl font-bold text-red-600">{formatAmount(document.remainingAmount)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Progression du paiement</p>
              <p className="text-sm font-semibold text-gray-900">{Math.round(paymentPercentage)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  document.status === DocumentStatus.PAID
                    ? "bg-green-600"
                    : document.status === DocumentStatus.PARTIALLY_PAID
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }`}
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Historique des Paiements</h2>
        </div>
        <div className="px-6 py-5">
          {!payments || payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun paiement enregistré</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.justification.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {payment.justification.category}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(payment.justification.date)}</span>
                      </div>
                      {payment.justification.reference && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Référence:</strong> {payment.justification.reference}
                        </p>
                      )}
                      {payment.justification.note && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Note:</strong> {payment.justification.note}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Décaissement:</strong> {payment.intervenant.name} •{" "}
                        <a
                          href={`/disbursements/${payment.disbursement.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Voir le décaissement
                        </a>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{formatAmount(payment.justification.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      {document.attachments && document.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Pièces jointes</h2>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-2">
              {document.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{attachment}</span>
                  </div>
                  <a
                    href={`/api/documents/${documentId}/files/${attachment}`}
                    download
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setIsEditFormOpen(true)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Modifier
        </button>
        {document.status === DocumentStatus.UNPAID && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Supprimer
          </button>
        )}
        {document.remainingAmount > 0 && (
          <button
            onClick={() => router.push(`/disbursements?documentId=${documentId}`)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            + Ajouter un paiement
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Edit Form Modal */}
      {isEditFormOpen && (
        <DocumentForm
          isOpen={isEditFormOpen}
          editDocument={document}
          onClose={() => setIsEditFormOpen(false)}
          onSuccess={() => {
            setIsEditFormOpen(false);
            fetchDocument();
            showToast("Document modifié avec succès", "success");
          }}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
