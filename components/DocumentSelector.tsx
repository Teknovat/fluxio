"use client";

import { useState, useEffect } from "react";
import { Document, DocumentType, DocumentStatus } from "@/types";
import { formatAmount } from "@/lib/currency";

interface DocumentSelectorProps {
  onSelect: (document: Document | null) => void;
  selectedDocumentId?: string;
}

export default function DocumentSelector({ onSelect, selectedDocumentId }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch documents with remaining amount > 0
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      // We want documents that are not fully paid (have remaining amount > 0)
      // This means UNPAID or PARTIALLY_PAID status
      // Use array syntax: status[]=UNPAID&status[]=PARTIALLY_PAID
      params.append("status[]", DocumentStatus.UNPAID);
      params.append("status[]", DocumentStatus.PARTIALLY_PAID);

      // Fetch all matching documents (no pagination for selector)
      params.append("limit", "100");

      const response = await fetch(`/api/documents?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }

      const data = await response.json();

      // Filter to only show documents with remaining amount > 0
      const availableDocuments = data.documents.filter((doc: Document) => doc.remainingAmount > 0);

      setDocuments(availableDocuments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Error fetching documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get document type label
  const getTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      INVOICE: "Facture",
      PAYSLIP: "Bulletin",
      PURCHASE_ORDER: "Bon de commande",
      CONTRACT: "Contrat",
      OTHER: "Autre",
    };
    return labels[type];
  };

  // Get document type icon
  const getTypeIcon = (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
      INVOICE: "📄",
      PAYSLIP: "💰",
      PURCHASE_ORDER: "🛒",
      CONTRACT: "📋",
      OTHER: "📎",
    };
    return icons[type];
  };

  // Filter documents by search term
  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();
    return doc.reference.toLowerCase().includes(search) || getTypeLabel(doc.type).toLowerCase().includes(search);
  });

  const handleDocumentSelect = (document: Document) => {
    if (selectedDocumentId === document.id) {
      // Deselect if clicking the same document
      onSelect(null);
    } else {
      onSelect(document);
    }
  };

  const handleClearSelection = () => {
    onSelect(null);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div>
        <label htmlFor="document-search" className="block text-sm font-medium text-gray-700 mb-1">
          Rechercher un document
        </label>
        <input
          type="text"
          id="document-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Référence..."
          className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Chargement des documents...</p>
        </div>
      )}

      {/* Documents List */}
      {!isLoading && (
        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-2">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              {searchTerm.trim() ? "Aucun document trouvé pour cette recherche" : "Aucun document disponible"}
            </div>
          ) : (
            filteredDocuments.map((document) => {
              const isSelected = selectedDocumentId === document.id;

              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => handleDocumentSelect(document)}
                  className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Document Reference and Type */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(document.type)}</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{document.reference}</p>
                          <p className="text-xs text-gray-500">{getTypeLabel(document.type)}</p>
                        </div>
                      </div>

                      {/* Remaining Amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Montant restant:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {formatAmount(document.remainingAmount)}
                        </span>
                      </div>

                      {/* Total Amount (for context) */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">Montant total:</span>
                        <span className="text-xs text-gray-600">{formatAmount(document.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Selected Document Info */}
      {selectedDocumentId && !isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Document sélectionné</p>
              <p className="text-xs text-blue-700 mt-1">
                {filteredDocuments.find((d) => d.id === selectedDocumentId)?.reference || "N/A"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">Seuls les documents avec un montant restant à payer sont affichés.</p>
    </div>
  );
}
