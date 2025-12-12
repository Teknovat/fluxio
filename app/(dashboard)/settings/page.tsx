"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";

interface Settings {
  id: string;
  debtThreshold: number;
  minCashBalance: number;
  reconciliationGapThreshold: number;
  defaultAdvanceDueDays: number;
  disbursementOutstandingThreshold: number;
  disbursementOpenDaysWarning: number;
  companyName: string;
  currency: string;
  alertsEnabled: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface UserInfo {
  role: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings
      const settingsResponse = await fetch("/api/settings");
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      } else {
        showToast("Erreur lors du chargement des paramètres", "error");
      }

      // Fetch tenant info
      const tenantResponse = await fetch("/api/tenant");
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenant(tenantData.tenant);
        setUserInfo({ role: tenantData.userRole });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      // Save settings
      const settingsResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!settingsResponse.ok) {
        const error = await settingsResponse.json();
        showToast(error.message || "Erreur lors de l'enregistrement des paramètres", "error");
        setIsSaving(false);
        return;
      }

      // Save tenant name if user is admin
      if (tenant && (userInfo?.role === "ADMIN" || userInfo?.role === "SUPER_ADMIN")) {
        const tenantResponse = await fetch("/api/tenant", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: tenant.name }),
        });

        if (!tenantResponse.ok) {
          const error = await tenantResponse.json();
          showToast(error.message || "Erreur lors de l'enregistrement du tenant", "error");
          setIsSaving(false);
          return;
        }
      }

      showToast("Paramètres enregistrés avec succès", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleChange = (field: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur lors du chargement des paramètres</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">
          {"Configurez les seuils d'alerte et les paramètres de l'application"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant Settings - Admin Only */}
        {tenant && (userInfo?.role === "ADMIN" || userInfo?.role === "SUPER_ADMIN") && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Informations du Tenant</h2>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin uniquement</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Tenant
                </label>
                <input
                  type="text"
                  id="tenantName"
                  value={tenant.name}
                  onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le nom du tenant apparaît dans la sélection de tenant lors de la connexion
                </p>
              </div>
              <div>
                <label htmlFor="tenantSlug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug du Tenant
                </label>
                <input
                  type="text"
                  id="tenantSlug"
                  value={tenant.slug}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Identifiant unique (non modifiable)</p>
              </div>
            </div>
          </div>
        )}

        {/* Company Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{"Informations de l'entreprise"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                {"Nom de l'entreprise"}
              </label>
              <input
                type="text"
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Devise
              </label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EUR">EUR - Euro (€)</option>
                <option value="USD">USD - Dollar US ($)</option>
                <option value="TND">TND - Dinar Tunisien (د.ت)</option>
                <option value="MAD">MAD - Dirham Marocain (د.م.)</option>
                <option value="XAF">XAF - Franc CFA (FCFA)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alert Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Paramètres des alertes</h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alertsEnabled}
                onChange={(e) => handleChange("alertsEnabled", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Alertes activées</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="debtThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                Seuil de dette ({settings.currency})
              </label>
              <input
                type="number"
                id="debtThreshold"
                value={settings.debtThreshold}
                onChange={(e) => handleChange("debtThreshold", parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Alerte si un intervenant doit plus que ce montant</p>
            </div>

            <div>
              <label htmlFor="minCashBalance" className="block text-sm font-medium text-gray-700 mb-1">
                Solde minimum de caisse ({settings.currency})
              </label>
              <input
                type="number"
                id="minCashBalance"
                value={settings.minCashBalance}
                onChange={(e) => handleChange("minCashBalance", parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Alerte si le solde de caisse est inférieur</p>
            </div>

            <div>
              <label htmlFor="reconciliationGapThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                {"Seuil d'écart de rapprochement"} ({settings.currency})
              </label>
              <input
                type="number"
                id="reconciliationGapThreshold"
                value={settings.reconciliationGapThreshold}
                onChange={(e) => handleChange("reconciliationGapThreshold", parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{"Alerte si l'écart dépasse ce montant"}</p>
            </div>

            <div>
              <label
                htmlFor="disbursementOutstandingThreshold"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Seuil décaissements en cours ({settings.currency})
              </label>
              <input
                type="number"
                id="disbursementOutstandingThreshold"
                value={settings.disbursementOutstandingThreshold}
                onChange={(e) => handleChange("disbursementOutstandingThreshold", parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Alerte si le total des décaissements en cours dépasse</p>
            </div>

            <div>
              <label htmlFor="disbursementOpenDaysWarning" className="block text-sm font-medium text-gray-700 mb-1">
                Jours avant alerte décaissement ouvert
              </label>
              <input
                type="number"
                id="disbursementOpenDaysWarning"
                value={settings.disbursementOpenDaysWarning}
                onChange={(e) => handleChange("disbursementOpenDaysWarning", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alerte si un décaissement est ouvert depuis ce nombre de jours
              </p>
            </div>

            <div>
              <label htmlFor="defaultAdvanceDueDays" className="block text-sm font-medium text-gray-700 mb-1">
                Échéance par défaut (jours)
              </label>
              <input
                type="number"
                id="defaultAdvanceDueDays"
                value={settings.defaultAdvanceDueDays}
                onChange={(e) => handleChange("defaultAdvanceDueDays", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {"Nombre de jours par défaut pour l'échéance des décaissements"}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
