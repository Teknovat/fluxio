"use client";

import { useState, useEffect } from "react";
import { Disbursement, DisbursementStatus, Justification, Mouvement } from "@/types";
import { formatAmount } from "@/lib/currency";
import { getDaysOutstanding, isDisbursementOverdue } from "@/lib/disbursement-calculations";

interface DisbursementWithDetails extends Disbursement {
  remaining: number;
  totalJustified: number;
  totalReturned: number;
  justifications?: Justification[];
  returns?: Mouvement[];
}

interface DisbursementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  disbursementId: string | null;
}

export default function DisbursementDetailModal({ isOpen, onClose, disbursementId }: DisbursementDetailModalProps) {
  const [disbursement, setDisbursement] = useState<DisbursementWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && disbursementId) {
      fetchDisbursementDetails();
    }
  }, [isOpen, disbursementId]);

  const fetchDisbursementDetails = async () => {
    if (!disbursementId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disbursements/${disbursementId}`);
      if (response.ok) {
        const data = await response.json();
        setDisbursement(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Erreur lors du chargement des détails");
      }
    } catch (err) {
      console.error("Error fetching disbursement details:", err);
      setError("Erreur lors du chargement des détails");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      OPEN: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PARTIALLY_JUSTIFIED: "bg-blue-100 text-blue-800 border-blue-200",
      JUSTIFIED: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[status];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Détails du Décaissement</h2>
              {disbursement && (
                <p className="text-blue-100 text-sm mt-1">
                  {disbursement.intervenant?.name} • {formatDate(disbursement.createdAt)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-blue-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">{error}</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                Fermer
              </button>
            </div>
          ) : disbursement ? (
            <div className="p-6 space-y-6">
              {/* Summary Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Status */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Statut</p>
                    <span
                      className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full border ${getStatusColor(
                        disbursement.status
                      )}`}
                    >
                      {getStatusLabel(disbursement.status)}
                    </span>
                  </div>

                  {/* Initial Amount */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Montant initial</p>
                    <p className="text-2xl font-bold text-blue-600">{formatAmount(disbursement.initialAmount)}</p>
                  </div>

                  {/* Justified + Returned */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Justifié + Retourné</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(disbursement.totalJustified + disbursement.totalReturned)}
                    </p>
                  </div>

                  {/* Remaining */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Reste dans sa poche</p>
                    <p className="text-2xl font-bold text-orange-600">{formatAmount(disbursement.remaining)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progression</span>
                    <span>
                      {Math.round(
                        ((disbursement.initialAmount - disbursement.remaining) / disbursement.initialAmount) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        disbursement.status === DisbursementStatus.JUSTIFIED
                          ? "bg-green-500"
                          : disbursement.status === DisbursementStatus.PARTIALLY_JUSTIFIED
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                      }`}
                      style={{
                        width: `${
                          ((disbursement.initialAmount - disbursement.remaining) / disbursement.initialAmount) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Jours en cours:</span>
                    <span className="ml-2 font-medium">
                      {getDaysOutstanding(disbursement)} jour{getDaysOutstanding(disbursement) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {disbursement.dueDate && (
                    <div>
                      <span className="text-gray-500">Échéance:</span>
                      <span
                        className={`ml-2 font-medium ${
                          isDisbursementOverdue(disbursement) ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {formatDate(disbursement.dueDate)}
                        {isDisbursementOverdue(disbursement) && " (En retard)"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Justifications Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
                  Justifications ({disbursement.justifications?.length || 0})
                </h3>

                {!disbursement.justifications || disbursement.justifications.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500">Aucune justification enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disbursement.justifications
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((justification) => (
                        <div
                          key={justification.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {justification.category}
                                </span>
                                <span className="text-sm text-gray-500">{formatDate(justification.date)}</span>
                              </div>
                              {justification.reference && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Référence:</span> {justification.reference}
                                </p>
                              )}
                              {justification.note && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Note:</span> {justification.note}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Créé le {formatDateTime(justification.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-purple-600">{formatAmount(justification.amount)}</p>
                              <p className="text-xs text-gray-500">Justification</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Returns Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                  Retours en Caisse ({disbursement.returns?.length || 0})
                </h3>

                {!disbursement.returns || disbursement.returns.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500">Aucun retour en caisse enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disbursement.returns
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((returnMvt) => (
                        <div
                          key={returnMvt.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Retour en caisse
                                </span>
                                <span className="text-sm text-gray-500">{formatDate(returnMvt.date)}</span>
                              </div>
                              {returnMvt.reference && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Référence:</span> {returnMvt.reference}
                                </p>
                              )}
                              {returnMvt.note && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Note:</span> {returnMvt.note}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Créé le {formatDateTime(returnMvt.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{formatAmount(returnMvt.amount)}</p>
                              <p className="text-xs text-gray-500">Retour caisse</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
