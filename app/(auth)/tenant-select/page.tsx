"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TenantSelectPage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantSlug.trim()) {
      // Redirect to login with tenant slug
      router.push(`/login?tenant=${encodeURIComponent(tenantSlug.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Fluxio</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Gestion de trésorerie pour entreprises</p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-700">{"Entrez l'identifiant de votre entreprise pour vous connecter"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tenant-slug" className="block text-sm font-medium text-gray-700 mb-1">
                {"Identifiant de l'entreprise"}
              </label>
              <input
                id="tenant-slug"
                name="tenantSlug"
                type="text"
                required
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="mon-entreprise"
              />
              <p className="mt-1 text-xs text-gray-500">Exemple : default, mon-entreprise, company-abc</p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continuer
            </button>
          </form>

          <div className="text-center space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">ou</span>
              </div>
            </div>

            <a
              href="/register"
              className="block w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Créer une nouvelle entreprise
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
