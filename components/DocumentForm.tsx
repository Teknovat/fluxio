"use client";

import { useState, useEffect } from "react";
import { DocumentType, Document } from "@/types";
import { getCurrency } from "@/lib/currency";

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editDocument?: Document | null;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function DocumentForm({
  isOpen,
  onClose,
  onSuccess,
  editDocument = null,
  onShowToast,
}: DocumentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [type, setType] = useState<DocumentType>(DocumentType.INVOICE);
  const [reference, setReference] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("€");

  // Document type labels
  const documentTypeLabels: Record<DocumentType, string> = {
    INVOICE: "Facture",
    PAYSLIP: "Bulletin de salaire",
    PURCHASE_ORDER: "Bon de commande",
    CONTRACT: "Contrat",
    OTHER: "Autre",
  };

  // Initialize form on mount
  useEffect(() => {
    if (isOpen) {
      const currency = getCurrency();
      setCurrencySymbol(currency.symbol);

      // Set default date to today
      if (!editDocument) {
        setIssueDate(new Date().toISOString().split("T")[0]);
      }
    }
  }, [isOpen, editDocument]);

  // Populate form when editing
  useEffect(() => {
    if (editDocument && isOpen) {
      setType(editDocument.type);
      setReference(editDocument.reference);
      setTotalAmount(editDocument.totalAmount.toString());
      setIssueDate(new Date(editDocument.issueDate).toISOString().split("T")[0]);
      setDueDate(editDocument.dueDate ? new Date(editDocument.dueDate).toISOString().split("T")[0] : "");
      setNotes(editDocument.notes || "");
    }
  }, [editDocument, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!reference.trim()) {
      errors.reference = "La référence est requise";
    }

    if (!totalAmount) {
      errors.totalAmount = "Le montant total est requis";
    } else if (parseFloat(totalAmount) <= 0) {
      errors.totalAmount = "Le montant doit être supérieur à 0";
    }

    if (!issueDate) {
      errors.issueDate = "La date d'émission est requise";
    }

    if (dueDate && issueDate && new Date(dueDate) < new Date(issueDate)) {
      errors.dueDate = "La date d'échéance doit être après la date d'émission";
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
        type,
        reference: reference.trim(),
        totalAmount: parseFloat(totalAmount),
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      };

      const url = editDocument ? `/api/documents/${editDocument.id}` : "/api/documents";
      const method = editDocument ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (onShowToast) {
          onShowToast(editDocument ? "Document modifié avec succès" : "Document créé avec succès", "success");
        }
        resetForm();
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || "Une erreur est survenue");
        if (onShowToast) {
          onShowToast(data.message || "Une erreur est survenue", "error");
        }
      }
    } catch (error) {
      console.error("Error submitting document:", error);
      setError("Erreur lors de la soumission du formulaire");
      if (onShowToast) {
        onShowToast("Erreur lors de la soumission du formulaire", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setType(DocumentType.INVOICE);
    setReference("");
    setTotalAmount("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setNotes("");
    setAttachments([]);
    setValidationErrors({});
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {editDocument ? "Modifier le document" : "Nouveau document"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type de document <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Référence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.reference ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: FAC-2024-001"
              disabled={isLoading}
            />
            {validationErrors.reference && <p className="mt-1 text-sm text-red-600">{validationErrors.reference}</p>}
          </div>

          {/* Total Amount */}
          <div>
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant total ({currencySymbol}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.totalAmount ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {validationErrors.totalAmount && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.totalAmount}</p>
            )}
          </div>

          {/* Issue Date */}
          <div>
            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;émission <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="issueDate"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.issueDate ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {validationErrors.issueDate && <p className="mt-1 text-sm text-red-600">{validationErrors.issueDate}</p>}
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;échéance
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.dueDate ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {validationErrors.dueDate && <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes additionnelles..."
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Enregistrement..." : editDocument ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
