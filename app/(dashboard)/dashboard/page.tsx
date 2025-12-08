"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CashBalanceCard from "@/components/CashBalanceCard";
import QuickActionButtons from "@/components/QuickActionButtons";
import RecentMovementsTable from "@/components/RecentMovementsTable";
import CashBalanceTrendChart from "@/components/CashBalanceTrendChart";
import CashInflowForm from "@/components/CashInflowForm";
import DisbursementForm from "@/components/DisbursementForm";
import Toast from "@/components/Toast";
import { formatAmount } from "@/lib/currency";

interface CashDashboardData {
  currentBalance: number;
  todayInflows: number;
  todayOutflows: number;
  netChangeToday: number;
  recentMovements: any[];
  balanceTrend: { date: string; balance: number }[];
  outstandingDisbursements: number;
  alerts: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<CashDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInflowForm, setShowInflowForm] = useState(false);
  const [showDisbursementForm, setShowDisbursementForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/cash/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdated(new Date());
      } else {
        showToast("Erreur lors du chargement du dashboard", "error");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast("Erreur lors du chargement du dashboard", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchDashboardData();
  };

  const handleInflowSuccess = () => {
    showToast("Entrée de caisse ajoutée avec succès", "success");
    fetchDashboardData();
  };

  const handleDisbursementSuccess = () => {
    showToast("Décaissement créé avec succès", "success");
    fetchDashboardData();
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur lors du chargement du dashboard</p>
        <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Trésorerie</h1>
        <p className="text-sm text-gray-500 mt-1">{"Vue d'ensemble de votre situation de caisse"}</p>
      </div>

      {/* Cash Balance Card */}
      <CashBalanceCard
        balance={dashboardData.currentBalance}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{"Entrées Aujourd'hui"}</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(dashboardData.todayInflows)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{"Sorties Aujourd'hui"}</p>
              <p className="text-2xl font-bold text-red-600">{formatAmount(dashboardData.todayOutflows)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Variation Nette</p>
              <p
                className={`text-2xl font-bold ${
                  dashboardData.netChangeToday >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {dashboardData.netChangeToday >= 0 ? "+" : ""}
                {formatAmount(dashboardData.netChangeToday)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Décaissements en cours</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatAmount(dashboardData.outstandingDisbursements)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionButtons
        onAddInflow={() => setShowInflowForm(true)}
        onCreateDisbursement={() => setShowDisbursementForm(true)}
        onViewMovements={() => router.push("/mouvements")}
      />

      {/* Alerts Section */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Alertes ({dashboardData.alerts.length})</h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                {dashboardData.alerts.slice(0, 3).map((alert: any, index: number) => (
                  <p key={index}>• {alert.message}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Trend Chart */}
        <CashBalanceTrendChart data={dashboardData.balanceTrend} />

        {/* Outstanding Disbursements Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Décaissements en cours</h3>
            <button
              onClick={() => router.push("/disbursements")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir tout →
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-orange-600">{formatAmount(dashboardData.outstandingDisbursements)}</p>
            <p className="text-sm text-gray-500 mt-2">Montant total à justifier</p>
            <button
              onClick={() => router.push("/disbursements?status=OPEN")}
              className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 text-sm font-medium"
            >
              Gérer les décaissements
            </button>
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <RecentMovementsTable movements={dashboardData.recentMovements} />

      {/* Modals */}
      <CashInflowForm
        isOpen={showInflowForm}
        onClose={() => setShowInflowForm(false)}
        onSuccess={handleInflowSuccess}
      />

      <DisbursementForm
        isOpen={showDisbursementForm}
        onClose={() => setShowDisbursementForm(false)}
        onSuccess={handleDisbursementSuccess}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
