"use client";

import { Mouvement, MouvementType, MovementCategory } from "@/types";
import { formatAmount } from "@/lib/currency";

interface RecentMovementsTableProps {
  movements: Mouvement[];
}

export default function RecentMovementsTable({ movements }: RecentMovementsTableProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
      REMBOURSEMENT_ASSOCIES: "Remboursement Associé",
      VENTES: "Ventes",
      CHARGES_FIXES: "Charges Fixes",
      CASH_RETURN: "Retour Caisse",
      AUTRES: "Autres",
    };
    return labels[category];
  };

  if (!movements || movements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mouvements Récents</h3>
        <div className="text-center py-12 text-gray-500">
          <p>Aucun mouvement récent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Mouvements Récents ({movements.length})</h3>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intervenant
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(movement.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      movement.type === MouvementType.ENTREE ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getTypeLabel(movement.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCategoryLabel(movement.category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {movement.intervenant?.name || "-"}
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
        {movements.map((movement) => (
          <div key={movement.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">{formatDate(movement.date)}</p>
                <p className="text-xs text-gray-500">{movement.intervenant?.name || "Sans intervenant"}</p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  movement.type === MouvementType.ENTREE ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
    </div>
  );
}
