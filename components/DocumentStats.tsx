"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAmount } from "@/lib/currency";
import { DocumentStats as DocumentStatsType } from "@/types";

export default function DocumentStats() {
  const router = useRouter();
  const [stats, setStats] = useState<DocumentStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/documents/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Error fetching document stats");
      }
    } catch (error) {
      console.error("Error fetching document stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (status?: string) => {
    if (status) {
      router.push(`/documents?status=${status}`);
    } else {
      router.push("/documents");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Documents
        </h3>
        <button
          onClick={() => router.push("/documents")}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Voir tout →
        </button>
      </div>

      <div className="space-y-3">
        {/* Unpaid Documents */}
        <button
          onClick={() => handleNavigate("UNPAID")}
          className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Documents impayés</p>
                <p className="text-xs text-gray-500">{stats.unpaid.count} document(s)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">{formatAmount(stats.unpaid.amount)}</p>
            </div>
          </div>
        </button>

        {/* Overdue Documents */}
        <button
          onClick={() => handleNavigate()}
          className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Documents en retard</p>
                <p className="text-xs text-gray-500">{stats.overdue.count} document(s)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-600">{formatAmount(stats.overdue.amount)}</p>
            </div>
          </div>
        </button>

        {/* Due Within 7 Days */}
        <button
          onClick={() => handleNavigate()}
          className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">À échéance (7 jours)</p>
                <p className="text-xs text-gray-500">{stats.dueWithin7Days.count} document(s)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-yellow-600">{formatAmount(stats.dueWithin7Days.amount)}</p>
            </div>
          </div>
        </button>

        {/* Partially Paid Documents */}
        <button
          onClick={() => handleNavigate("PARTIALLY_PAID")}
          className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Partiellement payés</p>
                <p className="text-xs text-gray-500">{stats.partiallyPaid.count} document(s)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">{formatAmount(stats.partiallyPaid.amount)}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
