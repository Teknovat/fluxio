"use client";

import { useState, useEffect } from "react";
import { User, Role } from "@/types";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: User | null;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export default function UserForm({ isOpen, onClose, onSuccess, editUser = null, onShowToast }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showLastAdminWarning, setShowLastAdminWarning] = useState(false);
  const [activeAdminCount, setActiveAdminCount] = useState<number | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.USER);
  const [active, setActive] = useState(true);

  // Fetch active admin count when editing an admin user
  useEffect(() => {
    const fetchActiveAdminCount = async () => {
      if (editUser && editUser.role === Role.ADMIN && editUser.active) {
        try {
          const response = await fetch("/api/users");
          if (response.ok) {
            const users: User[] = await response.json();
            const count = users.filter((u) => u.role === Role.ADMIN && u.active).length;
            setActiveAdminCount(count);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      } else {
        setActiveAdminCount(null);
      }
    };

    if (isOpen) {
      fetchActiveAdminCount();
    }
  }, [editUser, isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setEmail(editUser.email);
      setPassword(""); // Don't populate password for security
      setRole(editUser.role);
      setActive(editUser.active);
    } else {
      // Reset to defaults for new user
      setName("");
      setEmail("");
      setPassword("");
      setRole(Role.USER);
      setActive(true);
    }
    setShowLastAdminWarning(false);
  }, [editUser, isOpen]);

  // Check if attempting to deactivate last admin
  useEffect(() => {
    if (editUser && editUser.role === Role.ADMIN && editUser.active && !active && activeAdminCount === 1) {
      setShowLastAdminWarning(true);
    } else {
      setShowLastAdminWarning(false);
    }
  }, [active, editUser, activeAdminCount]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Le nom est requis";
    } else if (name.trim().length < 2) {
      errors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Format d'email invalide";
    }

    // Password is required for create, optional for edit
    if (!editUser && !password) {
      errors.password = "Le mot de passe est requis";
    } else if (password && password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!role) {
      errors.role = "Le rôle est requis";
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
        email: email.trim(),
        role,
      };

      // Include password only if provided
      if (password) {
        payload.password = password;
      }

      // Include active status only when editing
      if (editUser) {
        payload.active = active;
      }

      const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PATCH" : "POST";

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
        onShowToast(editUser ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès", "success");
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
    setEmail("");
    setPassword("");
    setRole(Role.USER);
    setActive(true);
    setValidationErrors({});
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRoleLabel = (role: Role): string => {
    const labels: Record<Role, string> = {
      ADMIN: "Administrateur",
      USER: "Utilisateur",
    };
    return labels[role];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Last Admin Warning */}
          {showLastAdminWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-start">
              <svg
                className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">
                Attention : Vous ne pouvez pas désactiver le dernier administrateur actif du système.
              </span>
            </div>
          )}

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
              placeholder="Nom de l'utilisateur"
            />
            {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="email@exemple.com"
            />
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {!editUser && <span className="text-red-500">*</span>}
              {editUser && <span className="text-gray-500 text-xs">(laisser vide pour ne pas modifier)</span>}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={editUser ? "Nouveau mot de passe" : "Mot de passe"}
            />
            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
          </div>

          {/* Role Select */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rôle <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.role ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value={Role.USER}>{getRoleLabel(Role.USER)}</option>
              <option value={Role.ADMIN}>{getRoleLabel(Role.ADMIN)}</option>
            </select>
            {validationErrors.role && <p className="mt-1 text-sm text-red-600">{validationErrors.role}</p>}
          </div>

          {/* Active Checkbox (only for edit mode) */}
          {editUser && (
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
              disabled={isLoading || showLastAdminWarning}
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
              ) : editUser ? (
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
