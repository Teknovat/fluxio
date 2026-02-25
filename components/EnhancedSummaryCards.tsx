"use client";

import { useState, useEffect } from "react";
import { formatAmount } from "@/lib/currency";

interface SummaryData {
  totalDisbursed: number;
  totalJustified: number;
  totalOutstanding: number;
}

interface EnhancedSummaryCardsProps {
  summary: SummaryData;
  isLoading?: boolean;
  className?: string;
}

interface CardData {
  key: keyof SummaryData;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  value: number;
  color: {
    primary: string;
    secondary: string;
    gradient: string;
    accent: string;
    shadow: string;
  };
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function EnhancedSummaryCards({
  summary,
  isLoading = false,
  className = "",
}: EnhancedSummaryCardsProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({
    totalDisbursed: 0,
    totalJustified: 0,
    totalOutstanding: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  // Animate values on mount and data change
  useEffect(() => {
    setIsVisible(true);

    const duration = 1500; // 1.5 seconds
    const steps = 60; // 60 FPS
    const stepDuration = duration / steps;

    Object.keys(summary).forEach((key) => {
      const targetValue = summary[key as keyof SummaryData];
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep / steps, 1);

        // Easing function (ease-out cubic)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = targetValue * easedProgress;

        setAnimatedValues((prev) => ({
          ...prev,
          [key]: currentValue,
        }));

        if (progress >= 1) {
          clearInterval(timer);
        }
      }, stepDuration);
    });
  }, [summary]);

  const calculateProgress = (justified: number, total: number) => {
    return total > 0 ? (justified / total) * 100 : 0;
  };

  const progress = calculateProgress(summary.totalJustified, summary.totalDisbursed);

  const cardData: CardData[] = [
    {
      key: "totalDisbursed",
      title: "Total Décaissé",
      subtitle: "Montant distribué",
      value: animatedValues.totalDisbursed,
      color: {
        primary: "text-blue-700",
        secondary: "text-blue-600",
        gradient: "from-blue-500 to-indigo-600",
        accent: "bg-blue-500",
        shadow: "shadow-blue-500/20",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      key: "totalJustified",
      title: "Total Justifié",
      subtitle: "Montant documenté",
      value: animatedValues.totalJustified,
      color: {
        primary: "text-emerald-700",
        secondary: "text-emerald-600",
        gradient: "from-emerald-500 to-green-600",
        accent: "bg-emerald-500",
        shadow: "shadow-emerald-500/20",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      trend: {
        value: progress,
        isPositive: true,
      },
    },
    {
      key: "totalOutstanding",
      title: "En Attente",
      subtitle: "Reste à justifier",
      value: animatedValues.totalOutstanding,
      color: {
        primary: "text-red-700",
        secondary: "text-red-600",
        gradient: "from-red-500 to-rose-600",
        accent: "bg-red-500",
        shadow: "shadow-red-500/20",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="w-16 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-32 h-8 bg-gray-200 rounded" />
              <div className="w-20 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {cardData.map((card, index) => (
          <div
            key={card.key}
            className={`
              group relative bg-white rounded-2xl shadow-lg ${card.color.shadow}
              hover:shadow-xl transition-all duration-500 ease-out
              transform hover:-translate-y-1
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
            style={{
              animationDelay: `${index * 150}ms`,
              transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 150}ms`,
            }}
          >
            {/* Gradient Border */}
            <div
              className={`
              absolute inset-0 rounded-2xl bg-gradient-to-r ${card.color.gradient}
              opacity-0 group-hover:opacity-100 transition-opacity duration-500
              before:absolute before:inset-[2px] before:rounded-2xl before:bg-white
            `}
            />

            {/* Card Content */}
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`
                  w-12 h-12 rounded-xl bg-gradient-to-br ${card.color.gradient}
                  flex items-center justify-center text-white shadow-lg
                  group-hover:scale-110 transition-transform duration-300
                `}
                >
                  {card.icon}
                </div>

                {card.trend && (
                  <div
                    className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
                    ${card.trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                  `}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d={
                          card.trend.isPositive
                            ? "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                            : "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                        }
                        clipRule="evenodd"
                      />
                    </svg>
                    {card.trend.value.toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Title and Value */}
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{card.title}</h3>
                <div
                  className={`
                  text-3xl font-bold ${card.color.primary}
                  font-['SF_Pro_Display','system-ui',sans-serif]
                  tabular-nums
                `}
                >
                  {formatAmount(card.value)}
                </div>
                <p className="text-xs text-gray-500 font-medium">{card.subtitle}</p>
              </div>

              {/* Progress Bar for Justified */}
              {card.key === "totalJustified" && summary.totalDisbursed > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progression</span>
                    <span className="font-mono">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${card.color.gradient} transition-all duration-1000 ease-out`}
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        animation: isVisible ? `progressFill 1s ease-out ${index * 150 + 500}ms both` : "none",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Outstanding Alert */}
              {card.key === "totalOutstanding" && card.value > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-700 font-medium">Justifications en attente</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hover Glow Effect */}
            <div
              className={`
              absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20
              bg-gradient-to-r ${card.color.gradient} blur-xl
              transition-opacity duration-500
            `}
            />
          </div>
        ))}
      </div>

      {/* Global Progress Overview */}
      {summary.totalDisbursed > 0 && (
        <div
          className={`
          mt-6 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200
          rounded-2xl p-6 shadow-sm
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
          style={{
            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 600ms",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{"Vue d'ensemble"}</h3>
                <p className="text-xs text-slate-600">Statut global des décaissements</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-800">{progress.toFixed(1)}%</div>
              <div className="text-xs text-slate-600">justifié</div>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 rounded-full shadow-sm"
              style={{
                width: `${Math.min(progress, 100)}%`,
                animation: isVisible ? "progressGlow 2s ease-out 800ms both" : "none",
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progressFill {
          from {
            width: 0%;
            opacity: 0;
          }
          to {
            width: ${Math.min(progress, 100)}%;
            opacity: 1;
          }
        }

        @keyframes progressGlow {
          from {
            width: 0%;
            box-shadow: none;
          }
          to {
            width: ${Math.min(progress, 100)}%;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </>
  );
}
