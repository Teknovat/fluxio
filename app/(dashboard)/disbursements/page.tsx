"use client";

import { useEffect, useState } from "react";
import { Disbursement, DisbursementStatus, DisbursementCategory, Intervenant } from "@/types";
import { formatAmount } from "@/lib/currency";
import Toast from "@/components/Toast";
import DisbursementForm from "@/components/DisbursementForm";
import JustificationForm from "@/components/JustificationForm";
import ReturnToCashForm from "@/components/ReturnToCashForm";
import { getDaysOutstanding, isDisbursementOverdue } from "@/lib/disbursement-calculations";

interface DisbursementWithRemaining extends Disbursement {
  remaining: number;
}

interface DisbursementSummary {
  totalDisbursed: number;
  totalJustified: number;
  totalOutstanding: number;
}

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState<DisbursementWithRemaining[]>([]);
  const [summary, setSummary] = useState<DisbursementSummary>({
    totalDisbursed: 0,
    totalJustified: 0,
    totalOutstanding: 0,
  });
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedIntervenant, setSelectedIntervenant] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal states
  const [isDisbursementFormOpen, setIsDisbursementFormOpen] = useState(false);
  const [isJustificationFormOpen, setIsJustificationFormOpen] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementWithRemaining | null>(null);

  // Fetch data when filters change
  useEffect(() => {
    fetchDisbursements();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedIntervenant, selectedCategory, dateFrom, dateTo]);

  // Fetch intervenants on mount
  useEffect(() => {
    fetchIntervenants();
  }, []);

  const fetchDisbursements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedIntervenant !== "ALL") params.append("intervenantId", selectedIntervenant);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/disbursements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDisbursements(data);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors du chargement des décaissements", "error");
      }
    } catch (error) {
      console.error("Error fetching disbursements:", error);
      showToast("Erreur lors du chargement des décaissements", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/disbursements/summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchIntervenants = async () => {
    try {
      const response = await fetch("/api/intervenants?active=true");
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data.intervenants);
      }
    } catch (error) {
      console.error("Error fetching intervenants:", error);
    }
  };

  const clearFilters = () => {
    setSelectedStatus("ALL");
    setSelectedIntervenant("ALL");
    setSelectedCategory("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleJustify = (disbursement: DisbursementWithRemaining) => {
    setSelectedDisbursement(disbursement);
    setIsJustificationFormOpen(true);
  };

  const handleReturn = (disbursement: DisbursementWithRemaining) => {
    setSelectedDisbursement(disbursement);
    setIsReturnFormOpen(true);
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

  const getCategoryLabel = (category: DisbursementCategory | undefined): string => {
    if (!category) return "N/A";
    const labels: Record<DisbursementCategory, string> = {
      STOCK_PURCHASE: "Achat de stock",
      BANK_DEPOSIT: "Dépôt bancaire",
      SALARY_ADVANCE: "Avance sur salaire",
      GENERAL_EXPENSE: "Frais généraux",
      CAISSE_END_DAY: "Caisse Fin de Journée",
      OTHER: "Autre",
    };
    return labels[category];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Décaissements</h1>
        <button
          onClick={() => setIsDisbursementFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          + Nouveau Décaissement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="OPEN">Ouvert</option>
              <option value="PARTIALLY_JUSTIFIED">Partiellement justifié</option>
              <option value="JUSTIFIED">Justifié</option>
            </select>
          </div>

          {/* Intervenant Filter */}
          <div>
            <label htmlFor="intervenant" className="block text-sm font-medium text-gray-700 mb-1">
              Intervenant
            </label>
            <select
              id="intervenant"
              value={selectedIntervenant}
              onChange={(e) => setSelectedIntervenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les intervenants</option>
              {intervenants.map((intervenant) => (
                <option key={intervenant.id} value={intervenant.id}>
                  {intervenant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Toutes les catégories</option>
              <option value="STOCK_PURCHASE">Achat de stock</option>
              <option value="BANK_DEPOSIT">Dépôt bancaire</option>
              <option value="SALARY_ADVANCE">Avance sur salaire</option>
              <option value="CAISSE_END_DAY">Caisse Fin de Journée</option>
              <option value="GENERAL_EXPENSE">Frais généraux</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Disbursed */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total décaissé</div>
          <div className="text-2xl font-bold text-blue-600">{formatAmount(summary.totalDisbursed)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant total donné</div>
        </div>

        {/* Total Justified */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total justifié</div>
          <div className="text-2xl font-bold text-green-600">{formatAmount(summary.totalJustified)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant justifié + retourné</div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total en attente</div>
          <div className="text-2xl font-bold text-red-600">{formatAmount(summary.totalOutstanding)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant restant à justifier</div>
        </div>
      </div>

      {/* Disbursements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : disbursements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun décaissement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restant
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jours
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disbursements.map((disbursement) => {
                  const overdue = isDisbursementOverdue(disbursement);
                  const daysOutstanding = getDaysOutstanding(disbursement);

                  return (
                    <tr key={disbursement.id} className={`hover:bg-gray-50 ${overdue ? "bg-red-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {disbursement.intervenant?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(disbursement.mouvement?.date || disbursement.createdAt)}
                        </div>
                        {disbursement.dueDate && (
                          <div className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                            Échéance: {formatDate(disbursement.dueDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getCategoryLabel(disbursement.category)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            disbursement.status
                          )}`}
                        >
                          {getStatusLabel(disbursement.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatAmount(disbursement.initialAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                        {formatAmount(disbursement.remaining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {daysOutstanding} jour{daysOutstanding !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {disbursement.status !== DisbursementStatus.JUSTIFIED && (
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleJustify(disbursement)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Justifier
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleReturn(disbursement)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Retour
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Disbursement Form Modal */}
      <DisbursementForm
        isOpen={isDisbursementFormOpen}
        onClose={() => setIsDisbursementFormOpen(false)}
        onSuccess={() => {
          fetchDisbursements();
          fetchSummary();
        }}
        onShowToast={showToast}
      />

      {/* Justification Form Modal */}
      {selectedDisbursement && (
        <JustificationForm
          isOpen={isJustificationFormOpen}
          onClose={() => {
            setIsJustificationFormOpen(false);
            setSelectedDisbursement(null);
          }}
          onSuccess={() => {
            fetchDisbursements();
            fetchSummary();
          }}
          disbursement={selectedDisbursement}
          onShowToast={showToast}
        />
      )}

      {/* Return to Cash Form Modal */}
      {selectedDisbursement && (
        <ReturnToCashForm
          isOpen={isReturnFormOpen}
          onClose={() => {
            setIsReturnFormOpen(false);
            setSelectedDisbursement(null);
          }}
          onSuccess={() => {
            fetchDisbursements();
            fetchSummary();
          }}
          disbursement={selectedDisbursement}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
