"use client";

import { useState, useEffect } from "react";
import { Intervenant, DisbursementCategory } from "@/types";
import { getCurrency } from "@/lib/currency";

interface DisbursementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast?: (message: string, type: "success" | "error") => void;
  prefilledIntervenantId?: string;
}

export default function DisbursementForm({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
  prefilledIntervenantId,
}: DisbursementFormProps) {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [date, setDate] = useState("");
  const [intervenantId, setIntervenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<DisbursementCategory | "">("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("€");

  // Category labels
  const categoryLabels: Record<DisbursementCategory, string> = {
    STOCK_PURCHASE: "Achat de stock",
    BANK_DEPOSIT: "Dépôt bancaire",
    SALARY_ADVANCE: "Avance sur salaire",
    CAISSE_END_DAY: "Caisse Fin de Journée",
    GENERAL_EXPENSE: "Frais généraux",
    OTHER: "Autre",
  };

  // Fetch active intervenants and currency on mount
  useEffect(() => {
    if (isOpen) {
      fetchIntervenants();
      const currency = getCurrency();
      setCurrencySymbol(currency.symbol);
      // Default to today's date
      setDate(new Date().toISOString().split("T")[0]);
      // Set prefilled intervenant if provided
      if (prefilledIntervenantId) {
        setIntervenantId(prefilledIntervenantId);
      }
    }
  }, [isOpen, prefilledIntervenantId]);

  const fetchIntervenants = async () => {
    try {
      const response = await fetch("/api/intervenants?active=true");
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data.intervenants);
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

    // Due date is optional, but if provided, should be after the disbursement date
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const dateObj = new Date(date);
      if (dueDateObj < dateObj) {
        errors.dueDate = "La date d'échéance doit être après la date du décaissement";
      }
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
        amount: parseFloat(amount),
        category: category || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        note: note || undefined,
      };

      const response = await fetch("/api/disbursements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Une erreur est survenue");
      }

      // Reset form
      resetForm();

      // Show success toast
      if (onShowToast) {
        onShowToast("Décaissement créé avec succès", "success");
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
    setAmount("");
    setCategory("");
    setDueDate("");
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
          <h3 className="text-lg font-semibold text-gray-900">Nouveau Décaissement</h3>
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
            {intervenants.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Aucun intervenant actif trouvé. Veuillez créer un intervenant d&apos;abord.
              </p>
            )}
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

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie (optionnel)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DisbursementCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Input (Optional) */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;échéance (optionnel)
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.dueDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.dueDate && <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>}
            <p className="mt-1 text-xs text-gray-500">Date limite pour la justification du décaissement</p>
          </div>

          {/* Note Textarea (Optional) */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note (optionnel)
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
              disabled={isLoading || intervenants.length === 0}
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
                  Création...
                </span>
              ) : (
                "Créer le décaissement"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
