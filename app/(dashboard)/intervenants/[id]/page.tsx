"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Intervenant, Mouvement, Advance, IntervenantBalance, MouvementType, MovementCategory } from "@/types";
import { formatAmount } from "@/lib/currency";
import Toast from "@/components/Toast";

export default function IntervenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const intervenantId = params.id as string;

  const [balance, setBalance] = useState<IntervenantBalance | null>(null);
  const [movements, setMovements] = useState<Mouvement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Mouvement[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [expandedAdvance, setExpandedAdvance] = useState<string | null>(null);

  // Filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Fetch intervenant data
  useEffect(() => {
    if (intervenantId) {
      fetchIntervenantData();
    }
  }, [intervenantId]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [movements, dateFrom, dateTo, selectedType, selectedCategory]);

  const fetchIntervenantData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/balances/${intervenantId}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setMovements(data.movements);
        setAdvances(data.advances || []);
      } else if (response.status === 404) {
        showToast("Intervenant non trouvé", "error");
        router.push("/intervenants");
      } else {
        showToast("Erreur lors du chargement des données", "error");
      }
    } catch (error) {
      console.error("Error fetching intervenant data:", error);
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((m) => new Date(m.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter((m) => new Date(m.date) <= new Date(dateTo));
    }

    // Type filter
    if (selectedType !== "ALL") {
      filtered = filtered.filter((m) => m.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    setFilteredMovements(filtered);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      if (selectedType !== "ALL") queryParams.append("type", selectedType);
      if (selectedCategory !== "ALL") queryParams.append("category", selectedCategory);

      const response = await fetch(`/api/reports/export/intervenant/${intervenantId}?${queryParams.toString()}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `intervenant-${balance?.intervenant.name}-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Export réussi", "success");
      } else {
        showToast("Erreur lors de l'export", "error");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      showToast("Erreur lors de l'export", "error");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-red-600";
    if (balance < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getTypeLabel = (type: MouvementType) => {
    return type === MouvementType.ENTREE ? "Entrée" : "Sortie";
  };

  const getCategoryLabel = (category?: MovementCategory) => {
    if (!category) return "-";
    const labels: Record<MovementCategory, string> = {
      SALAIRES: "Salaires",
      ACHATS_STOCK: "Achats Stock",
      FRAIS_GENERAUX: "Frais Généraux",
      AVANCES_ASSOCIES: "Avances Associés",
      VENTES: "Ventes",
      CHARGES_FIXES: "Charges Fixes",
      AUTRES: "Autres",
    };
    return labels[category];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Intervenant non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => router.push("/intervenants")}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux intervenants
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{balance.intervenant.name}</h1>
          <p className="text-sm text-gray-500">
            {balance.intervenant.type} • {balance.intervenant.active ? "Actif" : "Inactif"}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exporter
        </button>
      </div>

      {/* Summary Statistics Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Entrées</p>
            <p className="text-xl font-semibold text-green-600">{formatAmount(balance.totalEntries)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Sorties</p>
            <p className="text-xl font-semibold text-red-600">{formatAmount(balance.totalExits)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Solde</p>
            <p className={`text-xl font-semibold ${getBalanceColor(balance.balance)}`}>
              {formatAmount(Math.abs(balance.balance))}
            </p>
            <p className="text-xs text-gray-500">
              {balance.balance > 0 ? "Doit à la société" : balance.balance < 0 ? "La société doit" : "Équilibré"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nombre de transactions</p>
            <p className="text-xl font-semibold text-gray-900">{balance.movementCount}</p>
            {balance.lastMovementDate && (
              <p className="text-xs text-gray-500">Dernière: {formatDate(balance.lastMovementDate)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Advances Section */}
      {advances.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Avances et Remboursements</h2>
          <div className="space-y-4">
            {advances.map((advance) => {
              const totalReimbursed = advance.reimbursements?.reduce((sum, r) => sum + r.amount, 0) || 0;
              const remaining = advance.amount - totalReimbursed;
              const progress = ((advance.amount - remaining) / advance.amount) * 100;
              const isOverdue = advance.dueDate && new Date(advance.dueDate) < new Date() && remaining > 0;

              return (
                <div
                  key={advance.id}
                  className={`border rounded-lg ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                >
                  {/* Advance Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Avance du {formatDate(advance.createdAt)}</p>
                        <p className="text-sm text-gray-500">
                          Montant: {formatAmount(advance.amount)} • Remboursé: {formatAmount(totalReimbursed)} •
                          Restant: {formatAmount(remaining)}
                        </p>
                        {advance.dueDate && (
                          <p className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                            Échéance: {formatDate(advance.dueDate)}
                            {isOverdue && " (En retard)"}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          advance.status === "REMBOURSE_TOTAL"
                            ? "bg-green-100 text-green-800"
                            : advance.status === "REMBOURSE_PARTIEL"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {advance.status === "REMBOURSE_TOTAL"
                          ? "Remboursé"
                          : advance.status === "REMBOURSE_PARTIEL"
                          ? "Partiel"
                          : "En cours"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${isOverdue ? "bg-red-500" : "bg-blue-600"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Reimbursement History Toggle */}
                    {advance.reimbursements && advance.reimbursements.length > 0 && (
                      <button
                        onClick={() => setExpandedAdvance(expandedAdvance === advance.id ? null : advance.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2"
                      >
                        <svg
                          className={`w-4 h-4 mr-1 transform transition-transform ${
                            expandedAdvance === advance.id ? "rotate-90" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {expandedAdvance === advance.id ? "Masquer" : "Voir"} l&apos;historique des remboursements (
                        {advance.reimbursements.length})
                      </button>
                    )}
                  </div>

                  {/* Reimbursement History */}
                  {expandedAdvance === advance.id && advance.reimbursements && advance.reimbursements.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Historique des remboursements</h4>
                      <div className="space-y-2">
                        {advance.reimbursements
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((reimbursement) => (
                            <div
                              key={reimbursement.id}
                              className="flex justify-between items-center p-3 bg-white rounded border border-gray-200"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formatDate(reimbursement.date)}</p>
                                {reimbursement.reference && (
                                  <p className="text-xs text-gray-500">Réf: {reimbursement.reference}</p>
                                )}
                                {reimbursement.note && (
                                  <p className="text-xs text-gray-600 mt-1">{reimbursement.note}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">
                                  {formatAmount(reimbursement.amount)}
                                </p>
                                <p className="text-xs text-gray-500">{reimbursement.modality || "N/A"}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-xs text-gray-600 mb-1">
              Date début
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-xs text-gray-600 mb-1">
              Date fin
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="typeFilter" className="block text-xs text-gray-600 mb-1">
              Type
            </label>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous</option>
              <option value="ENTREE">Entrée</option>
              <option value="SORTIE">Sortie</option>
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-xs text-gray-600 mb-1">
              Catégorie
            </label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Toutes</option>
              <option value="SALAIRES">Salaires</option>
              <option value="ACHATS_STOCK">Achats Stock</option>
              <option value="FRAIS_GENERAUX">Frais Généraux</option>
              <option value="AVANCES_ASSOCIES">Avances Associés</option>
              <option value="VENTES">Ventes</option>
              <option value="CHARGES_FIXES">Charges Fixes</option>
              <option value="AUTRES">Autres</option>
            </select>
          </div>
        </div>
        {(dateFrom || dateTo || selectedType !== "ALL" || selectedCategory !== "ALL") && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setSelectedType("ALL");
              setSelectedCategory("ALL");
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Movements Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Historique des mouvements ({filteredMovements.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun mouvement trouvé</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMovements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movement.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              movement.type === MouvementType.ENTREE
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {getTypeLabel(movement.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCategoryLabel(movement.category)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.reference || "-"}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            movement.type === MouvementType.ENTREE ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {movement.type === MouvementType.ENTREE ? "+" : "-"}
                          {formatAmount(movement.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{movement.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <div key={movement.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatDate(movement.date)}</p>
                        <p className="text-xs text-gray-500">{movement.reference || "Sans référence"}</p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.type === MouvementType.ENTREE
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getTypeLabel(movement.type)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{getCategoryLabel(movement.category)}</span>
                      <span
                        className={`text-sm font-semibold ${
                          movement.type === MouvementType.ENTREE ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {movement.type === MouvementType.ENTREE ? "+" : "-"}
                        {formatAmount(movement.amount)}
                      </span>
                    </div>
                    {movement.note && <p className="text-xs text-gray-500">{movement.note}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
