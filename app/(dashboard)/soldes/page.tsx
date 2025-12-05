"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IntervenantBalance, BalanceSummary, IntervenantType } from "@/types";
import BalanceCard from "@/components/BalanceCard";
import Toast from "@/components/Toast";
import { formatAmount } from "@/lib/currency";

export default function SoldesPage() {
  const router = useRouter();
  const [balances, setBalances] = useState<IntervenantBalance[]>([]);
  const [summary, setSummary] = useState<BalanceSummary>({
    totalOwedToCompany: 0,
    totalCompanyOwes: 0,
    netBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch balances when filters change
  useEffect(() => {
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, dateFrom, dateTo]);

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") params.append("type", selectedType);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/balances?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances);
        setSummary(data.summary);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors du chargement des soldes", "error");
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      showToast("Erreur lors du chargement des soldes", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedType("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleIntervenantClick = (intervenantId: string) => {
    router.push(`/intervenants/${intervenantId}`);
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      CLIENT: "Client",
      FOURNISSEUR: "Fournisseur",
      ASSOCIE: "Associé",
      COLLABORATEUR: "Collaborateur",
      CAISSE_BANQUE: "Caisse/Banque",
      AUTRE: "Autre",
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Soldes des Intervenants</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              {"Type d'intervenant"}
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les types</option>
              <option value="CLIENT">Client</option>
              <option value="FOURNISSEUR">Fournisseur</option>
              <option value="ASSOCIE">Associé</option>
              <option value="CAISSE_BANQUE">Caisse/Banque</option>
              <option value="AUTRE">Autre</option>
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
        {/* Total Owed to Company */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Dû à la société</div>
          <div className="text-2xl font-bold text-red-600">{formatAmount(summary.totalOwedToCompany)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant total des dettes</div>
        </div>

        {/* Total Company Owes */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Dû par la société</div>
          <div className="text-2xl font-bold text-green-600">{formatAmount(summary.totalCompanyOwes)}</div>
          <div className="text-xs text-gray-500 mt-1">Montant total des crédits</div>
        </div>

        {/* Net Balance */}
        <div
          className={`bg-white p-6 rounded-lg shadow border-l-4 ${
            summary.netBalance >= 0 ? "border-blue-500" : "border-orange-500"
          }`}
        >
          <div className="text-sm font-medium text-gray-600 mb-1">Solde net</div>
          <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            {formatAmount(summary.netBalance)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.netBalance >= 0 ? "Position positive" : "Position négative"}
          </div>
        </div>
      </div>

      {/* Balances Display */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun solde trouvé</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intervenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrées
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sorties
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solde
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mouvements
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balances.map((balance) => {
                    const balanceColor =
                      balance.balance > 0 ? "text-red-600" : balance.balance < 0 ? "text-green-600" : "text-gray-600";

                    return (
                      <tr
                        key={balance.intervenant.id}
                        onClick={() => handleIntervenantClick(balance.intervenant.id)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{balance.intervenant.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getTypeLabel(balance.intervenant.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                          {formatAmount(balance.totalEntries)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                          {formatAmount(balance.totalExits)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${balanceColor}`}>
                          {formatAmount(Math.abs(balance.balance))}
                          {balance.balance > 0 && (
                            <span className="ml-2 text-xs font-normal text-red-500">(Dette)</span>
                          )}
                          {balance.balance < 0 && (
                            <span className="ml-2 text-xs font-normal text-green-500">(Crédit)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {balance.movementCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden p-4 space-y-4">
              {balances.map((balance) => (
                <BalanceCard
                  key={balance.intervenant.id}
                  balance={balance}
                  onClick={() => handleIntervenantClick(balance.intervenant.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
