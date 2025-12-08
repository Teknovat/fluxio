"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Disbursement, DisbursementStatus, Justification, Mouvement } from "@/types";
import { formatAmount } from "@/lib/currency";
import { getDaysOutstanding, isDisbursementOverdue } from "@/lib/disbursement-calculations";
import Toast from "@/components/Toast";
import JustificationForm from "@/components/JustificationForm";
import ReturnToCashForm from "@/components/ReturnToCashForm";

interface DisbursementWithRemaining extends Disbursement {
  remaining: number;
  totalJustified: number;
  totalReturned: number;
}

export default function DisbursementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disbursementId = params.id as string;

  const [disbursement, setDisbursement] = useState<DisbursementWithRemaining | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal states
  const [isJustificationFormOpen, setIsJustificationFormOpen] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);

  useEffect(() => {
    fetchDisbursement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disbursementId]);

  const fetchDisbursement = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/disbursements/${disbursementId}`);
      if (response.ok) {
        const data = await response.json();
        setDisbursement(data);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors du chargement du décaissement", "error");
      }
    } catch (error) {
      console.error("Error fetching disbursement:", error);
      showToast("Erreur lors du chargement du décaissement", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

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

  if (!disbursement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Décaissement non trouvé</p>
        <button
          onClick={() => router.push("/disbursements")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const daysOutstanding = getDaysOutstanding(disbursement);
  const isOverdue = isDisbursementOverdue(disbursement);
  const progress = ((disbursement.initialAmount - disbursement.remaining) / disbursement.initialAmount) * 100;

  // Calculate days overdue
  let daysOverdue = 0;
  if (isOverdue && disbursement.dueDate) {
    const now = new Date();
    const due = new Date(disbursement.dueDate);
    const diffTime = Math.abs(now.getTime() - due.getTime());
    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/disbursements")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Retour à la liste
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Détails du Décaissement</h1>
        </div>
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(disbursement.status)}`}
        >
          {getStatusLabel(disbursement.status)}
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
                <strong>⚠️ Décaissement en retard</strong> - Échéance dépassée de {daysOverdue} jour
                {daysOverdue !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disbursement Summary Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Résumé</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Intervenant */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Intervenant</p>
              <p className="text-lg font-semibold text-gray-900">{disbursement.intervenant?.name || "N/A"}</p>
            </div>

            {/* Date */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Date de création</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(disbursement.mouvement?.date || disbursement.createdAt)}
              </p>
            </div>

            {/* Initial Amount */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Montant initial</p>
              <p className="text-lg font-semibold text-blue-600">{formatAmount(disbursement.initialAmount)}</p>
            </div>

            {/* Remaining Amount */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Montant restant</p>
              <p className="text-lg font-bold text-red-600">{formatAmount(disbursement.remaining)}</p>
            </div>

            {/* Total Justified */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total justifié</p>
              <p className="text-lg font-semibold text-green-600">{formatAmount(disbursement.totalJustified)}</p>
            </div>

            {/* Total Returned */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total retourné</p>
              <p className="text-lg font-semibold text-green-600">{formatAmount(disbursement.totalReturned)}</p>
            </div>

            {/* Days Outstanding */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Jours en cours</p>
              <p className="text-lg font-semibold text-gray-900">
                {daysOutstanding} jour{daysOutstanding !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Date d&apos;échéance</p>
              <p className={`text-lg font-semibold ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
                {disbursement.dueDate ? formatDate(disbursement.dueDate) : "Non définie"}
              </p>
              {isOverdue && (
                <p className="text-xs text-red-600 mt-1">
                  En retard de {daysOverdue} jour{daysOverdue !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Progression de la justification</p>
              <p className="text-sm font-semibold text-gray-900">{Math.round(progress)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  disbursement.status === DisbursementStatus.JUSTIFIED
                    ? "bg-green-600"
                    : disbursement.status === DisbursementStatus.PARTIALLY_JUSTIFIED
                    ? "bg-blue-600"
                    : "bg-yellow-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {disbursement.status !== DisbursementStatus.JUSTIFIED && (
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setIsJustificationFormOpen(true)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Ajouter une justification
              </button>
              <button
                onClick={() => setIsReturnFormOpen(true)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                + Ajouter un retour en caisse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Justifications History */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Historique des Justifications</h2>
        </div>
        <div className="px-6 py-5">
          {!disbursement.justifications || disbursement.justifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune justification enregistrée</p>
          ) : (
            <div className="space-y-4">
              {disbursement.justifications
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((justification: Justification) => (
                  <div
                    key={justification.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {justification.category}
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(justification.date)}</span>
                        </div>
                        {justification.reference && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Référence:</strong> {justification.reference}
                          </p>
                        )}
                        {justification.note && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Note:</strong> {justification.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Créé le {formatDateTime(justification.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{formatAmount(justification.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Returns to Cash History */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Historique des Retours en Caisse</h2>
        </div>
        <div className="px-6 py-5">
          {!disbursement.returns || disbursement.returns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun retour en caisse enregistré</p>
          ) : (
            <div className="space-y-4">
              {disbursement.returns
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((returnMovement: Mouvement) => (
                  <div
                    key={returnMovement.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Retour en caisse
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(returnMovement.date)}</span>
                        </div>
                        {returnMovement.reference && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Référence:</strong> {returnMovement.reference}
                          </p>
                        )}
                        {returnMovement.note && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Note:</strong> {returnMovement.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Créé le {formatDateTime(returnMovement.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{formatAmount(returnMovement.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Justification Form Modal */}
      <JustificationForm
        isOpen={isJustificationFormOpen}
        onClose={() => setIsJustificationFormOpen(false)}
        onSuccess={fetchDisbursement}
        disbursement={disbursement}
        onShowToast={showToast}
      />

      {/* Return to Cash Form Modal */}
      <ReturnToCashForm
        isOpen={isReturnFormOpen}
        onClose={() => setIsReturnFormOpen(false)}
        onSuccess={fetchDisbursement}
        disbursement={disbursement}
        onShowToast={showToast}
      />
    </div>
  );
}
