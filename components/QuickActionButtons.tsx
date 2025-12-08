"use client";

interface QuickActionButtonsProps {
  onAddInflow: () => void;
  onCreateDisbursement: () => void;
  onViewMovements: () => void;
}

export default function QuickActionButtons({
  onAddInflow,
  onCreateDisbursement,
  onViewMovements,
}: QuickActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Add Cash Inflow */}
      <button
        onClick={onAddInflow}
        className="flex items-center justify-center p-6 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all group"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-green-700">Ajouter Entrée</span>
          <span className="text-xs text-green-600 mt-1">Enregistrer une entrée de caisse</span>
        </div>
      </button>

      {/* Create Disbursement */}
      <button
        onClick={onCreateDisbursement}
        className="flex items-center justify-center p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all group"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-blue-700">Créer Décaissement</span>
          <span className="text-xs text-blue-600 mt-1">Nouveau décaissement</span>
        </div>
      </button>

      {/* View All Movements */}
      <button
        onClick={onViewMovements}
        className="flex items-center justify-center p-6 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all group"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-purple-700">Voir Mouvements</span>
          <span className="text-xs text-purple-600 mt-1">Historique complet</span>
        </div>
      </button>
    </div>
  );
}
