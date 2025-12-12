"use client";

import { useRouter } from "next/navigation";
import { Alert, AlertType } from "@/types";

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const router = useRouter();

  if (alerts.length === 0) return null;

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "WARNING":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return "bg-red-50 border-red-200 text-red-800";
      case "WARNING":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getAlertLink = (alert: Alert) => {
    switch (alert.type) {
      case AlertType.OVERDUE_DISBURSEMENT:
      case AlertType.LONG_OPEN_DISBURSEMENT:
        return alert.relatedId ? `/disbursements/${alert.relatedId}` : "/disbursements";
      case AlertType.HIGH_OUTSTANDING_DISBURSEMENTS:
        return "/disbursements";
      case AlertType.DEBT_THRESHOLD:
        return alert.relatedId ? `/intervenants/${alert.relatedId}` : "/soldes";
      case AlertType.LOW_CASH:
        return "/dashboard";
      case AlertType.RECONCILIATION_GAP:
        return "/dashboard";
      default:
        return null;
    }
  };

  const handleAlertClick = (alert: Alert) => {
    const link = getAlertLink(alert);
    if (link) {
      router.push(link);
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 flex items-start space-x-3 ${getAlertColor(alert.severity)}`}
        >
          <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.severity)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.title}</p>
            <p className="text-sm mt-1">{alert.message}</p>
            {getAlertLink(alert) && (
              <button
                onClick={() => handleAlertClick(alert)}
                className="text-sm font-medium underline mt-2 hover:opacity-80"
              >
                Voir les détails →
              </button>
            )}
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="flex-shrink-0 ml-3 hover:opacity-70"
            title="Ignorer cette alerte"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
