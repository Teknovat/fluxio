"use client";

import { Document, DocumentStatus } from "@/types";
import { formatAmount } from "@/lib/currency";

interface PaymentInsightsProps {
  documents: Document[];
}

export default function PaymentInsights({ documents }: PaymentInsightsProps) {
  // Calculate insights
  const totalDocuments = documents.length;
  const paidDocuments = documents.filter((doc) => doc.status === DocumentStatus.PAID).length;
  const partiallyPaidDocuments = documents.filter((doc) => doc.status === DocumentStatus.PARTIALLY_PAID).length;
  const unpaidDocuments = documents.filter((doc) => doc.status === DocumentStatus.UNPAID).length;

  const totalValue = documents.reduce((sum, doc) => sum + doc.totalAmount, 0);
  const totalPaid = documents.reduce((sum, doc) => sum + doc.paidAmount, 0);
  const totalRemaining = documents.reduce((sum, doc) => sum + doc.remainingAmount, 0);

  const paymentProgress = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;

  // Get overdue documents
  const overdueDocuments = documents.filter((doc) => {
    if (!doc.dueDate || doc.status === DocumentStatus.PAID) return false;
    return new Date(doc.dueDate) < new Date();
  });

  const overdueValue = overdueDocuments.reduce((sum, doc) => sum + doc.remainingAmount, 0);

  // Documents with payment activity (partially paid or fully paid)
  const documentsWithPayments = documents.filter((doc) => doc.paidAmount > 0);

  if (documents.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-6 shadow-sm border border-slate-200/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Aperçu des Paiements</h3>
          <p className="text-sm text-slate-600">Analyse des {totalDocuments} documents</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Progress */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Progression globale</span>
            <span className="text-lg font-bold text-blue-600">{Math.round(paymentProgress)}%</span>
          </div>
          <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {formatAmount(totalPaid)} sur {formatAmount(totalValue)}
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/80 shadow-sm">
          <span className="text-sm font-medium text-slate-600 block mb-3">Répartition des statuts</span>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600">Payés</span>
              </div>
              <span className="font-medium text-emerald-600">{paidDocuments}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-slate-600">Partiels</span>
              </div>
              <span className="font-medium text-amber-600">{partiallyPaidDocuments}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-slate-600">Non payés</span>
              </div>
              <span className="font-medium text-red-600">{unpaidDocuments}</span>
            </div>
          </div>
        </div>

        {/* Active Payments */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/80 shadow-sm">
          <span className="text-sm font-medium text-slate-600 block mb-1">Docs avec paiements</span>
          <div className="text-xl font-bold text-slate-900 mb-1">{documentsWithPayments.length}</div>
          <div className="text-xs text-slate-500">
            {documentsWithPayments.length > 0 ? <>Activité de paiement détectée</> : <>Aucun paiement enregistré</>}
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueDocuments.length > 0 ? (
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/60 shadow-sm">
            <span className="text-sm font-medium text-red-700 block mb-1">En retard</span>
            <div className="text-xl font-bold text-red-800 mb-1">{overdueDocuments.length}</div>
            <div className="text-xs text-red-600">{formatAmount(overdueValue)} à récupérer</div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/60 shadow-sm">
            <span className="text-sm font-medium text-emerald-700 block mb-1">À jour</span>
            <div className="text-xl font-bold text-emerald-800 mb-1">✓</div>
            <div className="text-xs text-emerald-600">Aucun retard détecté</div>
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      {documentsWithPayments.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl p-4 border border-blue-200/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                {documentsWithPayments.length} document{documentsWithPayments.length > 1 ? "s" : ""} avec historique de
                paiement
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {'Cliquez sur "Détails" sur une carte pour voir les justifications'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
