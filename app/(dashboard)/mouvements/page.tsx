"use client";

import { useEffect, useState } from "react";
import { Mouvement, Intervenant, MouvementType, MouvementSummary } from "@/types";
import MouvementForm from "@/components/MouvementForm";
import Toast from "@/components/Toast";
import CurrencySelector from "@/components/CurrencySelector";
import { formatAmount as formatCurrency } from "@/lib/currency";

export default function MouvementsPage() {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [summary, setSummary] = useState<MouvementSummary>({
    totalEntree: 0,
    totalSortie: 0,
    solde: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMouvement, setEditingMouvement] = useState<Mouvement | null>(null);
  const [deletingMouvement, setDeletingMouvement] = useState<Mouvement | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [currencyKey, setCurrencyKey] = useState(0);

  // Filter states
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIntervenantId, setSelectedIntervenantId] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | MouvementType>("ALL");
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [showModalityDropdown, setShowModalityDropdown] = useState(false);

  // Fetch user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showModalityDropdown && !target.closest(".modality-filter-container")) {
        setShowModalityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModalityDropdown]);

  // Fetch intervenants on mount
  useEffect(() => {
    fetchIntervenants();
  }, []);

  // Fetch mouvements when filters change
  useEffect(() => {
    fetchMouvements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, selectedIntervenantId, selectedType, selectedModalities]);

  const fetchIntervenants = async () => {
    try {
      const response = await fetch("/api/intervenants");
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data);
      }
    } catch (error) {
      console.error("Error fetching intervenants:", error);
    }
  };

  const fetchMouvements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (selectedIntervenantId) params.append("intervenantId", selectedIntervenantId);
      if (selectedType !== "ALL") params.append("type", selectedType);
      if (selectedModalities.length > 0) {
        selectedModalities.forEach((modality) => params.append("modality", modality));
      }

      const response = await fetch(`/api/mouvements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMouvements(data.mouvements);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching mouvements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedIntervenantId("");
    setSelectedType("ALL");
    setSelectedModalities([]);
  };

  const toggleModality = (modality: string) => {
    setSelectedModalities((prev) =>
      prev.includes(modality) ? prev.filter((m) => m !== modality) : [...prev, modality]
    );
  };

  const modalityOptions = [
    { value: "ESPECES", label: "Espèces" },
    { value: "CHEQUE", label: "Chèque" },
    { value: "VIREMENT", label: "Virement" },
    { value: "STOCK", label: "Stock" },
    { value: "SALAIRE", label: "Salaire" },
    { value: "AUTRE", label: "Autre" },
  ];

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount);
  };

  const handleCurrencyChange = () => {
    setCurrencyKey((prev) => prev + 1);
  };

  const isAdmin = user?.role === "ADMIN";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleEditMouvement = (mouvement: Mouvement) => {
    setEditingMouvement(mouvement);
  };

  const handleCloseEditModal = () => {
    setEditingMouvement(null);
  };

  const handleDeleteMouvement = (mouvement: Mouvement) => {
    setDeletingMouvement(mouvement);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMouvement) return;

    try {
      const response = await fetch(`/api/mouvements/${deletingMouvement.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("Mouvement supprimé avec succès", "success");
        setDeletingMouvement(null);
        fetchMouvements(); // Refresh list and recalculate summary
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Error deleting mouvement:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleCancelDelete = () => {
    setDeletingMouvement(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mouvements</h1>
        <div className="flex items-center space-x-3">
          {isAdmin && <CurrencySelector onCurrencyChange={handleCurrencyChange} />}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un mouvement
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Intervenant Filter */}
          <div>
            <label htmlFor="intervenant" className="block text-sm font-medium text-gray-700 mb-1">
              Intervenant
            </label>
            <select
              id="intervenant"
              value={selectedIntervenantId}
              onChange={(e) => setSelectedIntervenantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les intervenants</option>
              {intervenants.map((intervenant) => (
                <option key={intervenant.id} value={intervenant.id}>
                  {intervenant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as "ALL" | MouvementType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les types</option>
              <option value="ENTREE">Entrée</option>
              <option value="SORTIE">Sortie</option>
            </select>
          </div>

          {/* Modality Filter - Multi-select */}
          <div className="relative modality-filter-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modalités {selectedModalities.length > 0 && `(${selectedModalities.length})`}
            </label>
            <button
              type="button"
              onClick={() => setShowModalityDropdown(!showModalityDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex justify-between items-center"
            >
              <span className="text-sm text-gray-700">
                {selectedModalities.length === 0
                  ? "Toutes les modalités"
                  : selectedModalities.length === modalityOptions.length
                  ? "Toutes sélectionnées"
                  : `${selectedModalities.length} sélectionnée${selectedModalities.length > 1 ? "s" : ""}`}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showModalityDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {showModalityDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                  {modalityOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModalities.includes(option.value)}
                        onChange={() => toggleModality(option.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected modalities badges */}
            {selectedModalities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedModalities.map((modality) => {
                  const option = modalityOptions.find((o) => o.value === modality);
                  return (
                    <span
                      key={modality}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                    >
                      {option?.label}
                      <button
                        type="button"
                        onClick={() => toggleModality(modality)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
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
        {/* Total Entrée */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Entrée</div>
          <div className="text-2xl font-bold text-green-600">{formatAmount(summary.totalEntree)}</div>
        </div>

        {/* Total Sortie */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Sortie</div>
          <div className="text-2xl font-bold text-red-600">{formatAmount(summary.totalSortie)}</div>
        </div>

        {/* Solde */}
        <div
          className={`bg-white p-6 rounded-lg shadow border-l-4 ${
            summary.solde >= 0 ? "border-blue-500" : "border-red-500"
          }`}
        >
          <div className="text-sm font-medium text-gray-600 mb-1">Solde</div>
          <div className={`text-2xl font-bold ${summary.solde >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {formatAmount(summary.solde)}
          </div>
        </div>
      </div>

      {/* Mouvements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : mouvements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun mouvement trouvé</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intervenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modalité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mouvements.map((mouvement) => (
                    <tr key={mouvement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(mouvement.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mouvement.intervenant?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mouvement.type === "ENTREE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {mouvement.type === "ENTREE" ? "Entrée" : "Sortie"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(mouvement.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mouvement.reference || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mouvement.modality || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{mouvement.note || "-"}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditMouvement(mouvement)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteMouvement(mouvement)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {mouvements.map((mouvement) => (
                <div key={mouvement.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{mouvement.intervenant?.name}</div>
                      <div className="text-sm text-gray-500">{formatDate(mouvement.date)}</div>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mouvement.type === "ENTREE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {mouvement.type === "ENTREE" ? "Entrée" : "Sortie"}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatAmount(mouvement.amount)}</div>
                  {mouvement.reference && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Référence:</span> {mouvement.reference}
                    </div>
                  )}
                  {mouvement.modality && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Modalité:</span> {mouvement.modality}
                    </div>
                  )}
                  {mouvement.note && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Note:</span> {mouvement.note}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleEditMouvement(mouvement)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteMouvement(mouvement)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mouvement Form Modal - Add */}
      <MouvementForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchMouvements}
        isAdmin={isAdmin}
        onShowToast={showToast}
      />

      {/* Mouvement Form Modal - Edit */}
      <MouvementForm
        isOpen={!!editingMouvement}
        onClose={handleCloseEditModal}
        onSuccess={fetchMouvements}
        editMouvement={editingMouvement}
        isAdmin={isAdmin}
        onShowToast={showToast}
      />

      {/* Delete Confirmation Dialog */}
      {deletingMouvement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Êtes-vous sûr de vouloir supprimer ce mouvement ?
              </p>
              <div className="bg-gray-50 rounded-md p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(deletingMouvement.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Intervenant:</span>
                  <span className="font-medium text-gray-900">{deletingMouvement.intervenant?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span
                    className={`font-medium ${deletingMouvement.type === "ENTREE" ? "text-green-600" : "text-red-600"}`}
                  >
                    {deletingMouvement.type === "ENTREE" ? "Entrée" : "Sortie"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold text-gray-900">{formatAmount(deletingMouvement.amount)}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
    </div>
  );
}
