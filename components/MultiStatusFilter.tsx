"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DisbursementStatus } from "@/types";

interface StatusOption {
  value: DisbursementStatus | "ALL";
  label: string;
  shortLabel: string;
  color: {
    bg: string;
    text: string;
    border: string;
    active: string;
    hover: string;
    gradient: string;
  };
  icon: string;
  description: string;
}

interface MultiStatusFilterProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "ALL",
    label: "Tous les statuts",
    shortLabel: "Tous",
    icon: "◉",
    description: "Afficher tous les décaissements",
    color: {
      bg: "bg-gradient-to-br from-slate-50 to-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
      active: "bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 text-slate-900 shadow-lg shadow-slate-200/50",
      hover: "hover:from-slate-100 hover:to-slate-150 hover:border-slate-300 hover:shadow-md",
      gradient: "from-slate-400 to-slate-600"
    },
  },
  {
    value: DisbursementStatus.OPEN,
    label: "Ouvert",
    shortLabel: "Ouvert",
    icon: "○",
    description: "Décaissements non justifiés",
    color: {
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      text: "text-amber-800",
      border: "border-amber-200",
      active: "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 text-amber-900 shadow-lg shadow-amber-200/50",
      hover: "hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-md",
      gradient: "from-amber-400 to-orange-500"
    },
  },
  {
    value: DisbursementStatus.PARTIALLY_JUSTIFIED,
    label: "Partiellement justifié",
    shortLabel: "Partiel",
    icon: "◐",
    description: "Justification partielle",
    color: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      text: "text-blue-800",
      border: "border-blue-200",
      active: "bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300 text-blue-900 shadow-lg shadow-blue-200/50",
      hover: "hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-md",
      gradient: "from-blue-400 to-indigo-500"
    },
  },
  {
    value: DisbursementStatus.JUSTIFIED,
    label: "Justifié",
    shortLabel: "Justifié",
    icon: "●",
    description: "Entièrement justifiés",
    color: {
      bg: "bg-gradient-to-br from-emerald-50 to-green-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
      active: "bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300 text-emerald-900 shadow-lg shadow-emerald-200/50",
      hover: "hover:from-emerald-100 hover:to-green-100 hover:border-emerald-300 hover:shadow-md",
      gradient: "from-emerald-400 to-green-500"
    },
  },
];

export default function MultiStatusFilter({
  selectedStatuses,
  onStatusChange,
  disabled = false
}: MultiStatusFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic height for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      const height = isExpanded ? contentRef.current.scrollHeight : 0;
      setContentHeight(height);
    }
  }, [isExpanded, selectedStatuses]);

  const toggleStatus = useCallback(
    (status: string) => {
      if (disabled) return;

      if (status === "ALL") {
        onStatusChange([]);
        return;
      }

      const newStatuses = selectedStatuses.includes(status)
        ? selectedStatuses.filter((s) => s !== status)
        : [...selectedStatuses, status];

      onStatusChange(newStatuses);
    },
    [selectedStatuses, onStatusChange, disabled],
  );

  const isAllSelected = selectedStatuses.length === 0;
  const getActiveCount = () => selectedStatuses.length;

  const getDisplayText = () => {
    if (isAllSelected) return "Tous les statuts";
    if (selectedStatuses.length === 1) {
      const option = STATUS_OPTIONS.find((opt) => opt.value === selectedStatuses[0]);
      return option ? option.label : selectedStatuses[0];
    }
    return `${selectedStatuses.length} statuts sélectionnés`;
  };

  const getSelectedGradients = () => {
    if (isAllSelected) return "from-slate-400 to-slate-600";
    const gradients = selectedStatuses
      .map(status => STATUS_OPTIONS.find(opt => opt.value === status)?.color.gradient)
      .filter(Boolean);
    return gradients.length > 0 ? gradients.join(", ") : "from-blue-400 to-blue-600";
  };

  const isStatusSelected = (status: string) => {
    if (status === "ALL") return isAllSelected;
    return selectedStatuses.includes(status);
  };

  const handleKeyDown = (event: React.KeyboardEvent, status: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleStatus(status);
    }
  };

  return (
    <div className="relative w-full font-['SF_Pro_Display','system-ui',sans-serif]">
      {/* Main Control Button - Enhanced */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          aria-expanded={isExpanded}
          aria-haspopup="listbox"
          aria-label={`Filter by status: ${getDisplayText()}`}
          className={`
            group w-full px-5 py-3.5 text-left bg-white border-2 rounded-2xl
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${disabled
              ? 'opacity-50 cursor-not-allowed border-gray-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-lg focus:outline-none focus:border-blue-400 focus:shadow-xl'
            }
            ${isExpanded ? 'border-blue-300 shadow-xl ring-4 ring-blue-100/50' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Dynamic Status Indicator */}
              <div className="relative">
                <div className={`
                  w-3 h-3 rounded-full bg-gradient-to-r ${getSelectedGradients()}
                  ${isExpanded ? 'animate-pulse' : ''}
                  shadow-sm
                `} />
                {getActiveCount() > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg ring-2 ring-white">
                    {getActiveCount()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  {getDisplayText()}
                </div>
                {!isAllSelected && (
                  <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full" />
                    Filtrage actif
                  </div>
                )}
              </div>
            </div>

            <div className={`
              transition-transform duration-300 ease-out text-gray-400
              ${isExpanded ? 'rotate-180 text-blue-500' : 'group-hover:text-gray-600'}
            `}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Expandable Options Panel - Dynamic Height */}
      <div
        className="relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          className="bg-white border-2 border-gray-100 rounded-2xl shadow-2xl shadow-black/5 mt-3"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">
                  Filtrer par statut
                </h3>
              </div>
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-full">
                {getActiveCount()}/{STATUS_OPTIONS.length - 1}
              </div>
            </div>
          </div>

          {/* Status Options Grid - Optimized Spacing */}
          <div className="p-6 space-y-3">
            {STATUS_OPTIONS.map((option, index) => {
              const isSelected = isStatusSelected(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => toggleStatus(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  disabled={disabled}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isExpanded ? 0 : -1}
                  className={`
                    group relative w-full px-5 py-4 rounded-xl border-2
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isSelected
                      ? `${option.color.active} scale-[1.02] transform`
                      : `${option.color.bg} ${option.color.border} ${option.color.hover}`
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100/50'}
                  `}
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Enhanced Status Icon */}
                      <div className={`
                        relative text-xl transition-all duration-300
                        ${isSelected ? 'scale-125 rotate-12' : 'scale-100 group-hover:scale-110'}
                        ${option.color.text}
                      `}>
                        {option.icon}
                        {isSelected && (
                          <div className="absolute inset-0 bg-current opacity-20 rounded-full blur-sm scale-150" />
                        )}
                      </div>

                      {/* Status Information */}
                      <div className="text-left">
                        <div className={`text-sm font-bold ${option.color.text} leading-tight`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {option.description}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Selection Indicator */}
                    <div className={`
                      w-6 h-6 rounded-full border-2 transition-all duration-300
                      ${isSelected
                        ? `${option.color.border.replace('border-', 'border-')} bg-gradient-to-br ${option.color.gradient} shadow-lg`
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                      }
                    `}>
                      {isSelected && (
                        <div className="w-full h-full rounded-full bg-white/30 scale-50 transition-all duration-300" />
                      )}
                    </div>
                  </div>

                  {/* Animated Selection Overlay */}
                  {isSelected && (
                    <div className={`
                      absolute inset-0 rounded-xl opacity-10
                      bg-gradient-to-br ${option.color.gradient}
                      animate-pulse
                    `} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Enhanced Footer Actions */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onStatusChange([])}
                disabled={disabled || isAllSelected}
                className="px-3 py-2 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:bg-blue-50 rounded-lg"
              >
                Tout effacer
              </button>

              <div className="h-4 w-px bg-gray-300" />

              <button
                onClick={() => onStatusChange(STATUS_OPTIONS.slice(1).map((opt) => opt.value) as string[])}
                disabled={disabled || selectedStatuses.length === STATUS_OPTIONS.length - 1}
                className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-50 rounded-lg"
              >
                Tout sélectionner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Global Animations */}
      <style jsx>{`
        @keyframes slideInStatus {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes statusPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        .font-display {
          font-family: 'SF Pro Display', 'Inter', system-ui, sans-serif;
          font-feature-settings: 'ss01', 'ss02', 'cv01', 'cv03';
        }
      `}</style>
    </div>
  );
}