"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Intervenant,
  Mouvement,
  Disbursement,
  IntervenantBalance,
  MouvementType,
  MovementCategory,
  DisbursementStatus,
} from "@/types";
import { formatAmount } from "@/lib/currency";
import Toast from "@/components/Toast";
import DisbursementForm from "@/components/DisbursementForm";
import JustificationForm from "@/components/JustificationForm";
import ReturnToCashForm from "@/components/ReturnToCashForm";

export default function IntervenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const intervenantId = params.id as string;

  const [balance, setBalance] = useState<IntervenantBalance | null>(null);
  const [movements, setMovements] = useState<Mouvement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Mouvement[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [expandedDisbursement, setExpandedDisbursement] = useState<string | null>(null);
  const [showDisbursementForm, setShowDisbursementForm] = useState(false);
  const [showJustificationForm, setShowJustificationForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<(Disbursement & { remaining: number }) | null>(null);

  // Filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Fetch intervenant data
  useEffect(() => {
    if (intervenantId) {
      fetchIntervenantData();
      fetchDisbursements();
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

  const fetchDisbursements = async () => {
    try {
      const response = await fetch(`/api/disbursements?intervenantId=${intervenantId}`);
      if (response.ok) {
        const data = await response.json();
        setDisbursements(data || []);
      }
    } catch (error) {
      console.error("Error fetching disbursements:", error);
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
      REMBOURSEMENT_ASSOCIES: "Remboursement Associés",
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

      {/* Disbursements Summary Card */}
      {disbursements.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé des Décaissements</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Décaissé</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(disbursements.reduce((sum, d) => sum + d.initialAmount, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Justifié</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatAmount(
                  disbursements.reduce((sum, d) => sum + (d.justifications?.reduce((s, j) => s + j.amount, 0) || 0), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Retourné</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(
                  disbursements.reduce((sum, d) => sum + (d.returns?.reduce((s, r) => s + r.amount, 0) || 0), 0)
                )}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <p className="text-sm text-gray-600 mb-1">💰 Reste dans sa poche</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatAmount(
                  disbursements.reduce((sum, d) => {
                    const justified = d.justifications?.reduce((s, j) => s + j.amount, 0) || 0;
                    const returned = d.returns?.reduce((s, r) => s + r.amount, 0) || 0;
                    return sum + (d.initialAmount - justified - returned);
                  }, 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">À justifier ou retourner</p>
            </div>
          </div>
        </div>
      )}

      {/* Disbursements Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Décaissements</h2>
          <button
            onClick={() => setShowDisbursementForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Créer Décaissement
          </button>
        </div>

        {disbursements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun décaissement pour cet intervenant</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disbursements.map((disbursement) => {
              const totalJustified = disbursement.justifications?.reduce((sum, j) => sum + j.amount, 0) || 0;
              const totalReturned = disbursement.returns?.reduce((sum, r) => sum + r.amount, 0) || 0;
              const remaining = disbursement.initialAmount - totalJustified - totalReturned;
              const progress = ((disbursement.initialAmount - remaining) / disbursement.initialAmount) * 100;
              const isOverdue = disbursement.dueDate && new Date(disbursement.dueDate) < new Date() && remaining > 0;
              const daysOutstanding = Math.ceil(
                (new Date().getTime() - new Date(disbursement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={disbursement.id}
                  className={`border rounded-lg ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                >
                  {/* Disbursement Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Décaissement du {formatDate(disbursement.createdAt)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Montant: {formatAmount(disbursement.initialAmount)} • Justifié: {formatAmount(totalJustified)}{" "}
                          • Retourné: {formatAmount(totalReturned)} • Restant: {formatAmount(remaining)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {daysOutstanding} jour{daysOutstanding > 1 ? "s" : ""} depuis création
                        </p>
                        {disbursement.dueDate && (
                          <p className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                            Échéance: {formatDate(disbursement.dueDate)}
                            {isOverdue && " (En retard)"}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            disbursement.status === DisbursementStatus.JUSTIFIED
                              ? "bg-green-100 text-green-800"
                              : disbursement.status === DisbursementStatus.PARTIALLY_JUSTIFIED
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {disbursement.status === DisbursementStatus.JUSTIFIED
                            ? "Justifié"
                            : disbursement.status === DisbursementStatus.PARTIALLY_JUSTIFIED
                            ? "Partiel"
                            : "Ouvert"}
                        </span>
                        {remaining > 0 && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedDisbursement({ ...disbursement, remaining });
                                setShowJustificationForm(true);
                              }}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                              Justifier
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDisbursement({ ...disbursement, remaining });
                                setShowReturnForm(true);
                              }}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Retourner
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${isOverdue ? "bg-red-500" : "bg-blue-600"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* History Toggle */}
                    {((disbursement.justifications && disbursement.justifications.length > 0) ||
                      (disbursement.returns && disbursement.returns.length > 0)) && (
                      <button
                        onClick={() =>
                          setExpandedDisbursement(expandedDisbursement === disbursement.id ? null : disbursement.id)
                        }
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2"
                      >
                        <svg
                          className={`w-4 h-4 mr-1 transform transition-transform ${
                            expandedDisbursement === disbursement.id ? "rotate-90" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {expandedDisbursement === disbursement.id ? "Masquer" : "Voir"} l&apos;historique
                      </button>
                    )}
                  </div>

                  {/* History Details */}
                  {expandedDisbursement === disbursement.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                      {/* Justifications */}
                      {disbursement.justifications && disbursement.justifications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Justifications ({disbursement.justifications.length})
                          </h4>
                          <div className="space-y-2">
                            {disbursement.justifications
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((justification) => (
                                <div
                                  key={justification.id}
                                  className="flex justify-between items-center p-3 bg-white rounded border border-gray-200"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatDate(justification.date)}
                                    </p>
                                    <p className="text-xs text-gray-500">{justification.category}</p>
                                    {justification.reference && (
                                      <p className="text-xs text-gray-500">Réf: {justification.reference}</p>
                                    )}
                                    {justification.note && (
                                      <p className="text-xs text-gray-600 mt-1">{justification.note}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-purple-600">
                                      {formatAmount(justification.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500">Justification</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Returns */}
                      {disbursement.returns && disbursement.returns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Retours en Caisse ({disbursement.returns.length})
                          </h4>
                          <div className="space-y-2">
                            {disbursement.returns
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((returnMvt) => (
                                <div
                                  key={returnMvt.id}
                                  className="flex justify-between items-center p-3 bg-white rounded border border-gray-200"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(returnMvt.date)}</p>
                                    {returnMvt.reference && (
                                      <p className="text-xs text-gray-500">Réf: {returnMvt.reference}</p>
                                    )}
                                    {returnMvt.note && <p className="text-xs text-gray-600 mt-1">{returnMvt.note}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">
                                      {formatAmount(returnMvt.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500">Retour caisse</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              <option value="REMBOURSEMENT_ASSOCIES">Remboursement Associés</option>
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

      {/* Modals */}
      <DisbursementForm
        isOpen={showDisbursementForm}
        onClose={() => setShowDisbursementForm(false)}
        onSuccess={() => {
          showToast("Décaissement créé avec succès", "success");
          fetchDisbursements();
          fetchIntervenantData();
        }}
        prefilledIntervenantId={intervenantId}
      />

      {selectedDisbursement && (
        <>
          <JustificationForm
            isOpen={showJustificationForm}
            onClose={() => {
              setShowJustificationForm(false);
              setSelectedDisbursement(null);
            }}
            onSuccess={() => {
              showToast("Justification ajoutée avec succès", "success");
              fetchDisbursements();
              fetchIntervenantData();
            }}
            disbursement={selectedDisbursement}
          />

          <ReturnToCashForm
            isOpen={showReturnForm}
            onClose={() => {
              setShowReturnForm(false);
              setSelectedDisbursement(null);
            }}
            onSuccess={() => {
              showToast("Retour en caisse enregistré avec succès", "success");
              fetchDisbursements();
              fetchIntervenantData();
            }}
            disbursement={selectedDisbursement}
          />
        </>
      )}
    </div>
  );
}
