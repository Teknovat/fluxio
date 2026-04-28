"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Disbursement, DisbursementStatus, DisbursementCategory, Intervenant } from "@/types";
import { formatAmount } from "@/lib/currency";
import Toast from "@/components/Toast";
import DisbursementForm from "@/components/DisbursementForm";
import JustificationForm from "@/components/JustificationForm";
import ReturnToCashForm from "@/components/ReturnToCashForm";
import DisbursementDetailModal from "@/components/DisbursementDetailModal";
import MultiStatusFilter from "@/components/MultiStatusFilter";
import ActiveFiltersDisplay from "@/components/ActiveFiltersDisplay";
import EnhancedSummaryCards from "@/components/EnhancedSummaryCards";
import EnhancedTableSkeleton from "@/components/EnhancedTableSkeleton";
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
  const router = useRouter();
  const [disbursements, setDisbursements] = useState<DisbursementWithRemaining[]>([]);
  const [summary, setSummary] = useState<DisbursementSummary>({
    totalDisbursed: 0,
    totalJustified: 0,
    totalOutstanding: 0,
  });
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedIntervenant, setSelectedIntervenant] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal states
  const [isDisbursementFormOpen, setIsDisbursementFormOpen] = useState(false);
  const [isJustificationFormOpen, setIsJustificationFormOpen] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementWithRemaining | null>(null);
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(null);

  // Redirect USER role away from this page
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === "USER") {
          router.replace("/dashboard");
        }
      } catch {}
    }
  }, [router]);

  // Fetch data when filters change
  useEffect(() => {
    fetchDisbursements();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatuses, selectedIntervenant, selectedCategory, dateFrom, dateTo]);

  // Fetch intervenants on mount
  useEffect(() => {
    fetchIntervenants();
  }, []);

  const fetchDisbursements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // Add multiple statuses using status[] parameter
      selectedStatuses.forEach((status) => {
        params.append("status[]", status);
      });
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
      const params = new URLSearchParams();
      // Add multiple statuses using status[] parameter
      selectedStatuses.forEach((status) => {
        params.append("status[]", status);
      });
      if (selectedIntervenant !== "ALL") params.append("intervenantId", selectedIntervenant);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/disbursements/summary?${params.toString()}`);
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
    setSelectedStatuses([]);
    setSelectedIntervenant("ALL");
    setSelectedCategory("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const handleClearFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case "ALL":
        clearFilters();
        break;
      case "status":
        if (value) {
          setSelectedStatuses((prev) => prev.filter((s) => s !== value));
        }
        break;
      case "intervenant":
        setSelectedIntervenant("ALL");
        break;
      case "category":
        setSelectedCategory("ALL");
        break;
      case "dates":
        setDateFrom("");
        setDateTo("");
        break;
    }
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

  const handleViewDetails = (disbursement: DisbursementWithRemaining) => {
    setSelectedDisbursementId(disbursement.id);
    setIsDetailModalOpen(true);
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

      {/* Enhanced Filters Section */}
      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filtres de recherche</h2>
              <p className="text-sm text-slate-600">Affinez vos résultats avec des critères précis</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Enhanced Multi-Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <MultiStatusFilter
                selectedStatuses={selectedStatuses}
                onStatusChange={setSelectedStatuses}
                disabled={isLoading}
              />
            </div>

            {/* Intervenant Filter */}
            <div>
              <label htmlFor="intervenant" className="block text-sm font-medium text-slate-700 mb-2">
                Intervenant
              </label>
              <select
                id="intervenant"
                value={selectedIntervenant}
                onChange={(e) => setSelectedIntervenant(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-slate-400 transition-all duration-200"
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
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Catégorie
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-slate-400 transition-all duration-200"
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
              <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-slate-400 transition-all duration-200"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-slate-400 transition-all duration-200"
              />
            </div>
          </div>

          {/* Enhanced Clear Filters Button */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              {selectedStatuses.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Filtres actifs
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      <ActiveFiltersDisplay
        selectedStatuses={selectedStatuses}
        selectedIntervenant={selectedIntervenant}
        selectedCategory={selectedCategory}
        dateFrom={dateFrom}
        dateTo={dateTo}
        intervenants={intervenants}
        onClearFilter={handleClearFilter}
        totalResults={disbursements.length}
      />

      {/* Enhanced Summary Cards */}
      <EnhancedSummaryCards summary={summary} isLoading={isLoading} />

      {/* Enhanced Disbursements Table */}
      {isLoading ? (
        <EnhancedTableSkeleton />
      ) : disbursements.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">Aucun décaissement trouvé</p>
            <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
          </div>
        </div>
      ) : disbursements.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">Aucun décaissement trouvé</p>
            <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervenant
                    <div className="text-xs font-normal text-gray-400 mt-1">
                      Cliquez sur une ligne pour voir les détails
                    </div>
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
                    <tr
                      key={disbursement.id}
                      className={`hover:bg-gray-50 cursor-pointer ${overdue ? "bg-red-50" : ""}`}
                      onClick={() => handleViewDetails(disbursement)}
                    >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJustify(disbursement);
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Justifier
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReturn(disbursement);
                              }}
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
        </div>
      )}

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

      {/* Disbursement Detail Modal */}
      <DisbursementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDisbursementId(null);
        }}
        disbursementId={selectedDisbursementId}
      />
    </div>
  );
}
