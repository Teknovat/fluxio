"use client";

import { useState, useEffect } from "react";
import { Intervenant, IntervenantType } from "@/types";

interface IntervenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editIntervenant?: Intervenant | null;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function IntervenantForm({
  isOpen,
  onClose,
  onSuccess,
  editIntervenant = null,
  onShowToast,
}: IntervenantFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState<IntervenantType>(IntervenantType.CLIENT);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editIntervenant) {
      setName(editIntervenant.name);
      setType(editIntervenant.type);
      setActive(editIntervenant.active);
      setNotes(editIntervenant.notes || "");
    } else {
      // Reset to defaults for new intervenant
      setName("");
      setType(IntervenantType.CLIENT);
      setActive(true);
      setNotes("");
    }
  }, [editIntervenant, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Le nom est requis";
    } else if (name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!type) {
      errors.type = "Le type est requis";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        type,
        notes: notes.trim() || undefined,
      };

      // Include active status only when editing
      if (editIntervenant) {
        payload.active = active;
      }

      const url = editIntervenant ? `/api/intervenants/${editIntervenant.id}` : "/api/intervenants";
      const method = editIntervenant ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      // Reset form
      resetForm();

      // Show success toast
      if (onShowToast) {
        onShowToast(editIntervenant ? "Intervenant modifié avec succès" : "Intervenant créé avec succès", "success");
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);

      // Show error toast
      if (onShowToast) {
        onShowToast(errorMessage, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setType(IntervenantType.CLIENT);
    setActive(true);
    setNotes("");
    setValidationErrors({});
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editIntervenant ? "Modifier l'intervenant" : "Ajouter un intervenant"}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nom de l'intervenant"
            />
            {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
          </div>

          {/* Type Select */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as IntervenantType)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.type ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value={IntervenantType.CLIENT}>{getTypeLabel(IntervenantType.CLIENT)}</option>
              <option value={IntervenantType.FOURNISSEUR}>{getTypeLabel(IntervenantType.FOURNISSEUR)}</option>
              <option value={IntervenantType.ASSOCIE}>{getTypeLabel(IntervenantType.ASSOCIE)}</option>
              <option value={IntervenantType.COLLABORATEUR}>{getTypeLabel(IntervenantType.COLLABORATEUR)}</option>
              <option value={IntervenantType.CAISSE_BANQUE}>{getTypeLabel(IntervenantType.CAISSE_BANQUE)}</option>
              <option value={IntervenantType.AUTRE}>{getTypeLabel(IntervenantType.AUTRE)}</option>
            </select>
            {validationErrors.type && <p className="mt-1 text-sm text-red-600">{validationErrors.type}</p>}
          </div>

          {/* Notes Textarea */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes ou informations supplémentaires..."
            />
          </div>

          {/* Active Checkbox (only for edit mode) */}
          {editIntervenant && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Actif</span>
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enregistrement...
                </span>
              ) : editIntervenant ? (
                "Modifier"
              ) : (
                "Ajouter"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
