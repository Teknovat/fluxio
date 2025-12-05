"use client";

import { useEffect, useState } from "react";
import { Advance, AdvanceStatus, Intervenant } from "@/types";
import { formatAmount } from "@/lib/currency";
import Toast from "@/components/Toast";
import AdvanceForm from "@/components/AdvanceForm";
import ReimbursementForm from "@/components/ReimbursementForm";
import AdvanceCard from "@/components/AdvanceCard";

interface AdvanceWithRemaining extends Advance {
  remaining: number;
}

interface AdvanceSummary {
  totalAdvances: number;
  totalReimbursed: number;
  totalOutstanding: number;
}

export default function AvancesPage() {
  const [advances, setAdvances] = useState<AdvanceWithRemaining[]>([]);
  const [summary, setSummary] = useState<AdvanceSummary>({
    totalAdvances: 0,
    totalReimbursed: 0,
    totalOutstanding: 0,
  });
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedIntervenant, setSelectedIntervenant] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal states
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [isReimbursementFormOpen, setIsReimbursementFormOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceWithRemaining | null>(null);

  // Fetch data when filters change
  useEffect(() => {
    fetchAdvances();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedIntervenant, dateFrom, dateTo]);

  // Fetch intervenants on mount
  useEffect(() => {
    fetchIntervenants();
  }, []);

  const fetchAdvances = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedIntervenant !== "ALL") params.append("intervenantId", selectedIntervenant);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/advances?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAdvances(data);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors du chargement des avances", "error");
      }
    } catch (error) {
      console.error("Error fetching advances:", error);
      showToast("Erreur lors du chargement des avances", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/advances/summary");
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
        setIntervenants(data);
      }
    } catch (error) {
      console.error("Error fetching intervenants:", error);
    }
  };

  const clearFilters = () => {
    setSelectedStatus("ALL");
    setSelectedIntervenant("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleReimburse = (advance: AdvanceWithRemaining) => {
    setSelectedAdvance(advance);
    setIsReimbursementFormOpen(true);
  };

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

  const getDaysSince = (date: Date): number => {
    const now = new Date();
    const advanceDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - advanceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (advance: AdvanceWithRemaining): boolean => {
    if (!advance.dueDate) return false;
    return new Date(advance.dueDate) < new Date() && advance.status !== AdvanceStatus.REMBOURSE_TOTAL;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Avances</h1>
        <button
          onClick={() => setIsAdvanceFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          + Nouvelle Avance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="EN_COURS">En cours</option>
              <option value="REMBOURSE_PARTIEL">Remboursé partiellement</option>
              <option value="REMBOURSE_TOTAL">Remboursé totalement</option>
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
        {/* Total Advances */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total des avances</div>
          <div className="text-2xl font-bold text-blue-600">{formatAmount(summary.totalAdvances)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant total donné</div>
        </div>

        {/* Total Reimbursed */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total remboursé</div>
          <div className="text-2xl font-bold text-green-600">{formatAmount(summary.totalReimbursed)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant total récupéré</div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total en attente</div>
          <div className="text-2xl font-bold text-red-600">{formatAmount(summary.totalOutstanding)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant restant à rembourser</div>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : advances.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune avance trouvée</p>
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
                {advances.map((advance) => {
                  const overdue = isOverdue(advance);
                  const daysSince = getDaysSince(advance.createdAt);

                  return (
                    <tr key={advance.id} className={`hover:bg-gray-50 ${overdue ? "bg-red-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{advance.intervenant?.name || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(advance.mouvement?.date || advance.createdAt)}
                        </div>
                        {advance.dueDate && (
                          <div className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                            Échéance: {formatDate(advance.dueDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            advance.status
                          )}`}
                        >
                          {getStatusLabel(advance.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatAmount(advance.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                        {formatAmount(advance.remaining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {daysSince} jour{daysSince !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {advance.status !== AdvanceStatus.REMBOURSE_TOTAL && (
                          <button
                            onClick={() => handleReimburse(advance)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Rembourser
                          </button>
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

      {/* Advance Form Modal */}
      <AdvanceForm
        isOpen={isAdvanceFormOpen}
        onClose={() => setIsAdvanceFormOpen(false)}
        onSuccess={() => {
          fetchAdvances();
          fetchSummary();
        }}
        onShowToast={showToast}
      />

      {/* Reimbursement Form Modal */}
      <ReimbursementForm
        isOpen={isReimbursementFormOpen}
        onClose={() => {
          setIsReimbursementFormOpen(false);
          setSelectedAdvance(null);
        }}
        onSuccess={() => {
          fetchAdvances();
          fetchSummary();
        }}
        advance={selectedAdvance}
        onShowToast={showToast}
      />
    </div>
  );
}
