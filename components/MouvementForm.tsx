"use client";

import { useState, useEffect } from "react";
import { Intervenant, MouvementType, Modality, Mouvement } from "@/types";
import { getCurrency } from "@/lib/currency";

interface MouvementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMouvement?: Mouvement | null;
  isAdmin?: boolean;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function MouvementForm({
  isOpen,
  onClose,
  onSuccess,
  editMouvement = null,
  isAdmin = false,
  onShowToast,
}: MouvementFormProps) {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [date, setDate] = useState("");
  const [intervenantId, setIntervenantId] = useState("");
  const [type, setType] = useState<MouvementType>(MouvementType.ENTREE);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [modality, setModality] = useState<Modality | "">("");
  const [note, setNote] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("€");

  // Fetch active intervenants and currency on mount
  useEffect(() => {
    if (isOpen) {
      fetchIntervenants();
      const currency = getCurrency();
      setCurrencySymbol(currency.symbol);
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editMouvement) {
      setDate(new Date(editMouvement.date).toISOString().split("T")[0]);
      setIntervenantId(editMouvement.intervenantId);
      setType(editMouvement.type);
      setAmount(editMouvement.amount.toString());
      setReference(editMouvement.reference || "");
      setModality(editMouvement.modality || "");
      setNote(editMouvement.note || "");
    } else {
      // Default to today's date for new mouvements
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [editMouvement]);

  const fetchIntervenants = async () => {
    try {
      const response = await fetch("/api/intervenants?active=true");
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data);
      }
    } catch (error) {
      console.error("Error fetching intervenants:", error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!date) {
      errors.date = "La date est requise";
    }

    if (!intervenantId) {
      errors.intervenantId = "L'intervenant est requis";
    }

    if (!amount) {
      errors.amount = "Le montant est requis";
    } else if (parseFloat(amount) <= 0) {
      errors.amount = "Le montant doit être supérieur à 0";
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
      const payload = {
        date: new Date(date).toISOString(),
        intervenantId,
        type,
        amount: parseFloat(amount),
        reference: reference || undefined,
        modality: modality || undefined,
        note: note || undefined,
      };

      const url = editMouvement ? `/api/mouvements/${editMouvement.id}` : "/api/mouvements";
      const method = editMouvement ? "PATCH" : "POST";

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
        onShowToast(editMouvement ? "Mouvement modifié avec succès" : "Mouvement créé avec succès", "success");
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
    setDate(new Date().toISOString().split("T")[0]);
    setIntervenantId("");
    setType(MouvementType.ENTREE);
    setAmount("");
    setReference("");
    setModality("");
    setNote("");
    setValidationErrors({});
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editMouvement ? "Modifier le mouvement" : "Ajouter un mouvement"}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.date ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.date && <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>}
          </div>

          {/* Intervenant Dropdown */}
          <div>
            <label htmlFor="intervenant" className="block text-sm font-medium text-gray-700 mb-1">
              Intervenant <span className="text-red-500">*</span>
            </label>
            <select
              id="intervenant"
              value={intervenantId}
              onChange={(e) => setIntervenantId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.intervenantId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Sélectionner un intervenant</option>
              {intervenants.map((intervenant) => (
                <option key={intervenant.id} value={intervenant.id}>
                  {intervenant.name}
                </option>
              ))}
            </select>
            {validationErrors.intervenantId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.intervenantId}</p>
            )}
          </div>

          {/* Type Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={MouvementType.ENTREE}
                  checked={type === MouvementType.ENTREE}
                  onChange={(e) => setType(e.target.value as MouvementType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Entrée</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={MouvementType.SORTIE}
                  checked={type === MouvementType.SORTIE}
                  onChange={(e) => setType(e.target.value as MouvementType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Sortie</span>
              </label>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant ({currencySymbol}) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.amount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
              </div>
            </div>
            {validationErrors.amount && <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>}
          </div>

          {/* Reference Input (Optional) */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Référence
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numéro de référence"
            />
          </div>

          {/* Modality Select (Optional) */}
          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-gray-700 mb-1">
              Modalité
            </label>
            <select
              id="modality"
              value={modality}
              onChange={(e) => setModality(e.target.value as Modality | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une modalité</option>
              <option value={Modality.ESPECES}>Espèces</option>
              <option value={Modality.CHEQUE}>Chèque</option>
              <option value={Modality.VIREMENT}>Virement</option>
              <option value={Modality.STOCK}>Stock</option>
              <option value={Modality.SALAIRE}>Salaire</option>
              <option value={Modality.AUTRE}>Autre</option>
            </select>
          </div>

          {/* Note Textarea (Optional) */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ajouter une note..."
            />
          </div>

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
              ) : editMouvement ? (
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
