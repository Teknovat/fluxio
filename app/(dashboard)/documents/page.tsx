"use client";

import { useEffect, useState } from "react";
import { Document, DocumentStatus, DocumentType } from "@/types";
import Toast from "@/components/Toast";
import DocumentForm from "@/components/DocumentForm";
import DocumentCard from "@/components/DocumentCard";
import Pagination from "@/components/Pagination";
import { formatAmount } from "@/lib/currency";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [isDocumentFormOpen, setIsDocumentFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);

  // Fetch documents when filters or pagination change
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedType, dateFrom, dateTo, searchTerm, sortBy, sortOrder, currentPage, itemsPerPage]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      // Support multiple status filters using status[] array syntax
      if (selectedStatus !== "ALL") {
        params.append("status[]", selectedStatus);
      }

      if (selectedType !== "ALL") params.append("type", selectedType);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (searchTerm) params.append("search", searchTerm);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors du chargement des documents", "error");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      showToast("Erreur lors du chargement des documents", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedStatus("ALL");
    setSelectedType("ALL");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setSortBy("dueDate");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setIsDocumentFormOpen(true);
  };

  const handleDelete = (document: Document) => {
    setDeletingDocument(document);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDocument) return;

    try {
      const response = await fetch(`/api/documents/${deletingDocument.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("Document supprimé avec succès", "success");
        setDeletingDocument(null);
        fetchDocuments();
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleCancelDelete = () => {
    setDeletingDocument(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      ALL: "Tous les statuts",
      UNPAID: "Non payé",
      PARTIALLY_PAID: "Partiellement payé",
      PAID: "Payé",
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      ALL: "Tous les types",
      INVOICE: "Facture",
      PAYSLIP: "Bulletin de salaire",
      PURCHASE_ORDER: "Bon de commande",
      CONTRACT: "Contrat",
      OTHER: "Autre",
    };
    return labels[type] || type;
  };

  // Calculate summary statistics
  const summary = documents.reduce(
    (acc, doc) => {
      acc.totalAmount += doc.totalAmount;
      acc.paidAmount += doc.paidAmount;
      acc.remainingAmount += doc.remainingAmount;
      return acc;
    },
    { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button
          onClick={() => {
            setEditingDocument(null);
            setIsDocumentFormOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          + Nouveau Document
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par référence ou notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="UNPAID">Non payé</option>
              <option value="PARTIALLY_PAID">Partiellement payé</option>
              <option value="PAID">Payé</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les types</option>
              <option value="INVOICE">Facture</option>
              <option value="PAYSLIP">Bulletin de salaire</option>
              <option value="PURCHASE_ORDER">Bon de commande</option>
              <option value="CONTRACT">Contrat</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Trier par
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dueDate">{"Date d'échéance"}</option>
              <option value="totalAmount">Montant total</option>
              <option value="remainingAmount">Montant restant</option>
              <option value="issueDate">{"Date d'émission"}</option>
              <option value="reference">Référence</option>
            </select>
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
              Ordre
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Amount */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Montant total</div>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(summary.totalAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">Sur {documents.length} document(s)</div>
          </div>

          {/* Paid Amount */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Montant payé</div>
            <div className="text-2xl font-bold text-green-600">{formatAmount(summary.paidAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.totalAmount > 0 ? ((summary.paidAmount / summary.totalAmount) * 100).toFixed(1) : 0}% du total
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Montant restant</div>
            <div className="text-2xl font-bold text-red-600">{formatAmount(summary.remainingAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">À payer</div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || selectedStatus !== "ALL" || selectedType !== "ALL"
                ? "Aucun document trouvé avec ces critères"
                : "Aucun document trouvé"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Document Form Modal */}
      <DocumentForm
        isOpen={isDocumentFormOpen}
        onClose={() => {
          setIsDocumentFormOpen(false);
          setEditingDocument(null);
        }}
        onSuccess={() => {
          fetchDocuments();
        }}
        editDocument={editingDocument}
        onShowToast={showToast}
      />

      {/* Delete Confirmation Dialog */}
      {deletingDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer le document <strong>{deletingDocument.reference}</strong> ? Cette
                action est irréversible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
