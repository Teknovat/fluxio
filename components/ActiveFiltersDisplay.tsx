"use client";

import { DisbursementStatus, Intervenant, DisbursementCategory } from "@/types";

interface ActiveFiltersDisplayProps {
  selectedStatuses: string[];
  selectedIntervenant: string;
  selectedCategory: string;
  dateFrom: string;
  dateTo: string;
  intervenants: Intervenant[];
  onClearFilter: (filterType: string, value?: string) => void;
  totalResults: number;
}

export default function ActiveFiltersDisplay({
  selectedStatuses,
  selectedIntervenant,
  selectedCategory,
  dateFrom,
  dateTo,
  intervenants,
  onClearFilter,
  totalResults
}: ActiveFiltersDisplayProps) {
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      OPEN: "Ouvert",
      PARTIALLY_JUSTIFIED: "Partiellement justifié",
      JUSTIFIED: "Justifié",
    };
    return labels[status] || status;
  };

  const getStatusColors = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      OPEN: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
      PARTIALLY_JUSTIFIED: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      JUSTIFIED: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
    };
    return colorMap[status] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      STOCK_PURCHASE: "Achat de stock",
      BANK_DEPOSIT: "Dépôt bancaire",
      SALARY_ADVANCE: "Avance sur salaire",
      GENERAL_EXPENSE: "Frais généraux",
      CAISSE_END_DAY: "Caisse Fin de Journée",
      OTHER: "Autre",
    };
    return labels[category] || category;
  };

  const getIntervenantName = (id: string): string => {
    const intervenant = intervenants.find(i => i.id === id);
    return intervenant ? intervenant.name : id;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const hasActiveFilters = selectedStatuses.length > 0 ||
    selectedIntervenant !== "ALL" ||
    selectedCategory !== "ALL" ||
    dateFrom ||
    dateTo;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-blue-900">
            Filtres actifs
          </span>
          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-mono">
            {totalResults} résultat{totalResults !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={() => {
            onClearFilter("ALL");
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Tout effacer
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Status Filters */}
        {selectedStatuses.map(status => {
          const colors = getStatusColors(status);
          return (
            <div
              key={status}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">Statut:</span>
                <span className="text-xs">{getStatusLabel(status)}</span>
              </div>
              <button
                onClick={() => onClearFilter("status", status)}
                className="text-current hover:text-opacity-70 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Intervenant Filter */}
        {selectedIntervenant !== "ALL" && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">Intervenant:</span>
              <span className="text-xs">{getIntervenantName(selectedIntervenant)}</span>
            </div>
            <button
              onClick={() => onClearFilter("intervenant")}
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Category Filter */}
        {selectedCategory !== "ALL" && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">Catégorie:</span>
              <span className="text-xs">{getCategoryLabel(selectedCategory)}</span>
            </div>
            <button
              onClick={() => onClearFilter("category")}
              className="text-orange-600 hover:text-orange-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Date Range Filter */}
        {(dateFrom || dateTo) && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 border border-green-200 rounded-lg">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">Période:</span>
              <span className="text-xs">
                {dateFrom && dateTo
                  ? `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
                  : dateFrom
                  ? `Depuis ${formatDate(dateFrom)}`
                  : `Jusqu'au ${formatDate(dateTo)}`
                }
              </span>
            </div>
            <button
              onClick={() => onClearFilter("dates")}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}