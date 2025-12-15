"use client";

import { useState, useEffect } from "react";
import { Intervenant, IntervenantType, DocumentType, Document } from "@/types";
import { getCurrency } from "@/lib/currency";

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editDocument?: Document | null;
  prefilledIntervenantId?: string;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function DocumentForm({
  isOpen,
  onClose,
  onSuccess,
  editDocument = null,
  prefilledIntervenantId,
  onShowToast,
}: DocumentFormProps) {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form fields
  const [type, setType] = useState<DocumentType>(DocumentType.INVOICE);
  const [reference, setReference] = useState("");
  const [intervenantId, setIntervenantId] = useState("");
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

  // Fetch active intervenants and currency on mount
  useEffect(() => {
    if (isOpen) {
      fetchIntervenants();
      const currency = getCurrency();
      setCurrencySymbol(currency.symbol);

      // Default to today's date for issue date
      if (!editDocument) {
        setIssueDate(new Date().toISOString().split("T")[0]);
      }

      // Set prefilled intervenant if provided
      if (prefilledIntervenantId && !editDocument) {
        setIntervenantId(prefilledIntervenantId);
      }
    }
  }, [isOpen, prefilledIntervenantId, editDocument]);

  // Populate form when editing
  useEffect(() => {
    if (editDocument) {
      setType(editDocument.type);
      setReference(editDocument.reference);
      setIntervenantId(editDocument.intervenantId);
      setTotalAmount(editDocument.totalAmount.toString());
      setIssueDate(new Date(editDocument.issueDate).toISOString().split("T")[0]);
      setDueDate(editDocument.dueDate ? new Date(editDocument.dueDate).toISOString().split("T")[0] : "");
      setNotes(editDocument.notes || "");
      // Note: Existing attachments are not loaded into the file input
    } else {
      // Reset to defaults for new document
      resetForm();
    }
  }, [editDocument, isOpen]);

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

    if (!type) {
      errors.type = "Le type de document est requis";
    }

    if (!reference.trim()) {
      errors.reference = "La référence est requise";
    }

    if (!intervenantId) {
      errors.intervenantId = "L'intervenant est requis";
    }

    if (!totalAmount) {
      errors.totalAmount = "Le montant total est requis";
    } else if (parseFloat(totalAmount) <= 0) {
      errors.totalAmount = "Le montant total doit être supérieur à 0";
    } else if (editDocument && parseFloat(totalAmount) < editDocument.paidAmount) {
      errors.totalAmount = `Le montant total ne peut pas être inférieur au montant déjà payé (${editDocument.paidAmount})`;
    }

    if (!issueDate) {
      errors.issueDate = "La date d'émission est requise";
    }

    // Due date is optional, but if provided, should be after the issue date
    if (dueDate && issueDate) {
      const dueDateObj = new Date(dueDate);
      const issueDateObj = new Date(issueDate);
      if (dueDateObj < issueDateObj) {
        errors.dueDate = "La date d'échéance doit être après la date d'émission";
      }
    }

    // Validate file attachments
    for (const file of attachments) {
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        errors.attachments = "Les fichiers doivent être au format PDF, JPG ou PNG";
        break;
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        errors.attachments = `Le fichier "${file.name}" dépasse la taille maximale de 10MB`;
        break;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll handle file uploads as base64 or file paths
      // In a production environment, you'd upload to S3 or similar
      const attachmentPaths: string[] = [];

      // TODO: Implement actual file upload logic
      // For now, just store file names as placeholders
      if (attachments.length > 0) {
        attachments.forEach((file) => {
          attachmentPaths.push(`/uploads/${Date.now()}_${file.name}`);
        });
      }

      const payload: any = {
        type,
        reference: reference.trim(),
        intervenantId,
        totalAmount: parseFloat(totalAmount),
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        attachments: attachmentPaths.length > 0 ? attachmentPaths : undefined,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Une erreur est survenue");
      }

      // Reset form
      resetForm();

      // Show success toast
      if (onShowToast) {
        onShowToast(editDocument ? "Document modifié avec succès" : "Document créé avec succès", "success");
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
    setType(DocumentType.INVOICE);
    setReference("");
    setIntervenantId(prefilledIntervenantId || "");
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

  // Suggest intervenant type based on document type
  const getSuggestedIntervenantType = (docType: DocumentType): IntervenantType | null => {
    switch (docType) {
      case DocumentType.PAYSLIP:
        return IntervenantType.COLLABORATEUR;
      case DocumentType.INVOICE:
        return IntervenantType.FOURNISSEUR;
      default:
        return null;
    }
  };

  // Filter intervenants based on suggested type
  const getFilteredIntervenants = (): Intervenant[] => {
    const suggestedType = getSuggestedIntervenantType(type);
    if (!suggestedType) {
      return intervenants;
    }
    // Show suggested type first, then others
    return [
      ...intervenants.filter((i) => i.type === suggestedType),
      ...intervenants.filter((i) => i.type !== suggestedType),
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editDocument ? "Modifier le document" : "Nouveau Document"}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Document Type Select */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type de document <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.type ? "border-red-500" : "border-gray-300"
              }`}
            >
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {validationErrors.type && <p className="mt-1 text-sm text-red-600">{validationErrors.type}</p>}
          </div>

          {/* Reference Input */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Référence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.reference ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Numéro de facture, référence du document..."
            />
            {validationErrors.reference && <p className="mt-1 text-sm text-red-600">{validationErrors.reference}</p>}
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
              {getFilteredIntervenants().map((intervenant) => (
                <option key={intervenant.id} value={intervenant.id}>
                  {intervenant.name} ({intervenant.type})
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

          {/* Total Amount Input */}
          <div>
            <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant total ({currencySymbol}) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="totalAmount"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.totalAmount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
              </div>
            </div>
            {validationErrors.totalAmount && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.totalAmount}</p>
            )}
            {editDocument && editDocument.paidAmount > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Montant déjà payé : {editDocument.paidAmount} {currencySymbol}
              </p>
            )}
          </div>

          {/* Issue Date Input */}
          <div>
            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;émission <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="issueDate"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.issueDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.issueDate && <p className="mt-1 text-sm text-red-600">{validationErrors.issueDate}</p>}
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
          </div>

          {/* Notes Textarea */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Informations supplémentaires..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
              Pièces jointes (optionnel)
            </label>
            <input
              type="file"
              id="attachments"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.attachments ? "border-red-500" : "border-gray-300"
              }`}
            />
            {validationErrors.attachments && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.attachments}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Formats acceptés : PDF, JPG, PNG. Taille maximale : 10MB par fichier.
            </p>
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">Fichiers sélectionnés :</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {attachments.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                  Enregistrement...
                </span>
              ) : editDocument ? (
                "Modifier"
              ) : (
                "Créer le document"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
