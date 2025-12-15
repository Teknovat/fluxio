"use client";

import { useState, useEffect } from "react";
import { Intervenant, MovementCategory } from "@/types";

interface CashInflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CashInflowForm({ isOpen, onClose, onSuccess }: CashInflowFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<MovementCategory>(MovementCategory.VENTES);
  const [intervenantId, setIntervenantId] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchIntervenants();
      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setCategory(MovementCategory.VENTES);
      setIntervenantId("");
      setReference("");
      setNote("");
      setError("");
    }
  }, [isOpen]);

  const fetchIntervenants = async () => {
    try {
      const response = await fetch("/api/intervenants");
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data.intervenants || []);
      }
    } catch (error) {
      console.error("Error fetching intervenants:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Le montant doit être supérieur à 0");
      return;
    }

    if (!category) {
      setError("La catégorie est requise");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        date: new Date(date).toISOString(),
        amount: parseFloat(amount),
        category,
        intervenantId: intervenantId || undefined,
        reference: reference || undefined,
        note: note || undefined,
      };

      const response = await fetch("/api/cash/inflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'ajout de l'entrée");
      }
    } catch (error) {
      console.error("Error creating cash inflow:", error);
      setError("Erreur lors de l'ajout de l'entrée");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ajouter Entrée de Caisse</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Montant *
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MovementCategory)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={MovementCategory.VENTES}>Ventes</option>
                <option value={MovementCategory.AVANCES_ASSOCIES}>Avances Associés</option>
                <option value={MovementCategory.REMBOURSEMENT_ASSOCIES}>Remboursement Associés</option>
                <option value={MovementCategory.AUTRES}>Autres</option>
              </select>
            </div>

            <div>
              <label htmlFor="intervenant" className="block text-sm font-medium text-gray-700 mb-1">
                Intervenant (optionnel)
              </label>
              <select
                id="intervenant"
                value={intervenantId}
                onChange={(e) => setIntervenantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sélectionner --</option>
                {intervenants.map((intervenant) => (
                  <option key={intervenant.id} value={intervenant.id}>
                    {intervenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                Référence (optionnel)
              </label>
              <input
                type="text"
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Numéro de reçu, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Note (optionnel)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Détails supplémentaires..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting ? "Ajout..." : "Ajouter Entrée"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
