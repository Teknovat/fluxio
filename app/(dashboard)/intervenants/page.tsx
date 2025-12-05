"use client";

import { useEffect, useState } from "react";
import { Intervenant, IntervenantType } from "@/types";
import Toast from "@/components/Toast";
import IntervenantForm from "@/components/IntervenantForm";

export default function IntervenantsPage() {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [filteredIntervenants, setFilteredIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntervenant, setEditingIntervenant] = useState<Intervenant | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter state
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

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

  // Fetch intervenants on mount
  useEffect(() => {
    fetchIntervenants();
  }, []);

  // Apply type filter
  useEffect(() => {
    if (selectedTypeFilter === "ALL") {
      setFilteredIntervenants(intervenants);
    } else {
      setFilteredIntervenants(intervenants.filter((i) => i.type === selectedTypeFilter));
    }
  }, [selectedTypeFilter, intervenants]);

  const fetchIntervenants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/intervenants");
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data);
      }
    } catch (error) {
      console.error("Error fetching intervenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === "ADMIN";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleEditIntervenant = (intervenant: Intervenant) => {
    setEditingIntervenant(intervenant);
  };

  const getTypeLabel = (type: IntervenantType): string => {
    const labels: Record<IntervenantType, string> = {
      CLIENT: "Client",
      FOURNISSEUR: "Fournisseur",
      ASSOCIE: "Associé",
      COLLABORATEUR: "Collaborateur",
      CAISSE_BANQUE: "Caisse/Banque",
      AUTRE: "Autre",
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Intervenants</h1>
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
          Ajouter un intervenant
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700">
            Type:
          </label>
          <select
            id="typeFilter"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les types</option>
            <option value={IntervenantType.CLIENT}>{getTypeLabel(IntervenantType.CLIENT)}</option>
            <option value={IntervenantType.FOURNISSEUR}>{getTypeLabel(IntervenantType.FOURNISSEUR)}</option>
            <option value={IntervenantType.ASSOCIE}>{getTypeLabel(IntervenantType.ASSOCIE)}</option>
            <option value={IntervenantType.COLLABORATEUR}>{getTypeLabel(IntervenantType.COLLABORATEUR)}</option>
            <option value={IntervenantType.CAISSE_BANQUE}>{getTypeLabel(IntervenantType.CAISSE_BANQUE)}</option>
            <option value={IntervenantType.AUTRE}>{getTypeLabel(IntervenantType.AUTRE)}</option>
          </select>
        </div>
      </div>

      {/* Intervenants Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredIntervenants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun intervenant trouvé</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIntervenants.map((intervenant) => (
                    <tr key={intervenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {intervenant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTypeLabel(intervenant.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            intervenant.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {intervenant.active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditIntervenant(intervenant)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredIntervenants.map((intervenant) => (
                <div key={intervenant.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{intervenant.name}</div>
                      <div className="text-sm text-gray-500">{getTypeLabel(intervenant.type)}</div>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        intervenant.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {intervenant.active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => handleEditIntervenant(intervenant)}
                      className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Intervenant Form Modal */}
      <IntervenantForm
        isOpen={showAddModal || editingIntervenant !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingIntervenant(null);
        }}
        onSuccess={fetchIntervenants}
        editIntervenant={editingIntervenant}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
