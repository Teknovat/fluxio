"use client";

import { useState, useEffect } from "react";
import { Disbursement, JustificationCategory, Document } from "@/types";
import { formatAmount, getCurrency } from "@/lib/currency";
import DocumentSelector from "./DocumentSelector";

interface JustificationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  disbursement: Disbursement & { remaining: number };
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function JustificationForm({
  isOpen,
  onClose,
  onSuccess,
  disbursement,
  onShowToast,
}: JustificationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<JustificationCategory | "">("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("€");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);

  // Category labels
  const categoryLabels: Record<JustificationCategory, string> = {
    STOCK_PURCHASE: "Achat de stock",
    BANK_DEPOSIT: "Dépôt bancaire",
    CASH_RETURN: "Retour caisse",
    SALARY: "Salaire",
    TRANSPORT: "Transport",
    SUPPLIES: "Fournitures",
    UTILITIES: "Services publics",
    OTHER: "Autre",
  };

  useEffect(() => {
    if (isOpen) {
      const currency = getCurrency();
      setCurrencySymbol(currency.symbol);
      // Default to today's date
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!date) {
      errors.date = "La date est requise";
    }

    if (!amount) {
      errors.amount = "Le montant est requis";
    } else if (parseFloat(amount) <= 0) {
      errors.amount = "Le montant doit être supérieur à 0";
    } else if (parseFloat(amount) > disbursement.remaining) {
      errors.amount = `Le montant ne peut pas dépasser le montant restant (${formatAmount(disbursement.remaining)})`;
    } else if (selectedDocument && parseFloat(amount) > selectedDocument.remainingAmount) {
      errors.amount = `Le montant ne peut pas dépasser le montant restant du document (${formatAmount(
        selectedDocument.remainingAmount
      )})`;
    }

    if (!category) {
      errors.category = "La catégorie est requise";
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
        amount: parseFloat(amount),
        category,
        reference: reference || undefined,
        note: note || undefined,
        documentId: selectedDocument?.id || undefined,
      };

      const response = await fetch(`/api/disbursements/${disbursement.id}/justify`, {
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
        onShowToast("Justification ajoutée avec succès", "success");
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
    setAmount("");
    setCategory("");
    setReference("");
    setNote("");
    setSelectedDocument(null);
    setShowDocumentSelector(false);
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
          <h3 className="text-lg font-semibold text-gray-900">Ajouter une Justification</h3>
        </div>

        {/* Disbursement Details */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Intervenant</p>
              <p className="font-semibold text-gray-900">{disbursement.intervenant?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600">Montant initial</p>
              <p className="font-semibold text-gray-900">{formatAmount(disbursement.initialAmount)}</p>
            </div>
            <div>
              <p className="text-gray-600">Montant restant</p>
              <p className="font-bold text-red-600">{formatAmount(disbursement.remaining)}</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <strong>⚠️ Important :</strong> Cette action ne crée PAS de mouvement de caisse. Elle documente uniquement
            l&apos;utilisation des fonds.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Document Linking Section */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Lier à un document (optionnel)</label>
              <button
                type="button"
                onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showDocumentSelector ? "Masquer" : "Sélectionner un document"}
              </button>
            </div>

            {showDocumentSelector && (
              <div className="mt-3">
                <DocumentSelector
                  intervenantId={disbursement.intervenantId}
                  onSelect={setSelectedDocument}
                  selectedDocumentId={selectedDocument?.id}
                />
              </div>
            )}

            {/* Selected Document Info */}
            {selectedDocument && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Document sélectionné</p>
                    <p className="text-xs text-green-700 mt-1">
                      <strong>Référence:</strong> {selectedDocument.reference}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      <strong>Montant restant:</strong> {formatAmount(selectedDocument.remainingAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocument(null)}
                    className="text-sm text-green-600 hover:text-green-800 underline ml-2"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            )}
          </div>

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
                max={
                  selectedDocument
                    ? Math.min(disbursement.remaining, selectedDocument.remainingAmount)
                    : disbursement.remaining
                }
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

            {/* Warning if amount exceeds document remaining */}
            {selectedDocument && amount && parseFloat(amount) > selectedDocument.remainingAmount && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
                <strong>⚠️ Attention :</strong> Le montant dépasse le montant restant du document (
                {formatAmount(selectedDocument.remainingAmount)})
              </div>
            )}

            {/* Display limits */}
            <div className="mt-1 text-xs text-gray-500 space-y-1">
              <p>Maximum (décaissement) : {formatAmount(disbursement.remaining)}</p>
              {selectedDocument && (
                <p className="text-blue-600">Maximum (document) : {formatAmount(selectedDocument.remainingAmount)}</p>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as JustificationCategory)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Sélectionner une catégorie</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {validationErrors.category && <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>}
          </div>

          {/* Reference Input */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Référence (optionnel)
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numéro de facture, reçu, etc."
            />
          </div>

          {/* Note Textarea */}
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
              placeholder="Détails supplémentaires..."
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
                  Ajout...
                </span>
              ) : (
                "Ajouter la justification"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
