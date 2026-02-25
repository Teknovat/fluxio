"use client";

export default function EnhancedTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Table Header Skeleton */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
        <div className="grid grid-cols-8 gap-4">
          {['Intervenant', 'Date', 'Catégorie', 'Statut', 'Montant', 'Restant', 'Jours', 'Actions'].map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"
              style={{
                animationDelay: `${index * 100}ms`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-gray-100">
        {[...Array(8)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="px-6 py-4 hover:bg-gray-50/50 transition-colors duration-200"
            style={{
              animationDelay: `${rowIndex * 80}ms`,
            }}
          >
            <div className="grid grid-cols-8 gap-4 items-center">
              {/* Intervenant */}
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-3/4" />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-purple-200 to-purple-300 rounded-lg animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-2/3" />
              </div>

              {/* Category */}
              <div className="h-4 bg-gradient-to-r from-green-200 to-green-300 rounded-lg animate-pulse" />

              {/* Status */}
              <div className="w-20 h-6 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-full animate-pulse" />

              {/* Amount */}
              <div className="text-right">
                <div className="h-4 bg-gradient-to-r from-indigo-200 to-indigo-300 rounded-lg animate-pulse ml-auto w-3/4" />
              </div>

              {/* Remaining */}
              <div className="text-right">
                <div className="h-4 bg-gradient-to-r from-red-200 to-red-300 rounded-lg animate-pulse ml-auto w-2/3" />
              </div>

              {/* Days */}
              <div className="text-center">
                <div className="h-4 bg-gradient-to-r from-orange-200 to-orange-300 rounded-lg animate-pulse mx-auto w-1/2" />
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-2">
                <div className="w-16 h-6 bg-gradient-to-r from-blue-200 to-blue-300 rounded-md animate-pulse" />
                <div className="w-16 h-6 bg-gradient-to-r from-green-200 to-green-300 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Loading Indicators */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative h-full overflow-hidden">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer" />

          {/* Floating dots */}
          <div className="absolute top-4 right-4 flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}