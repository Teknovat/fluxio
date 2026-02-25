"use client";

import { useState, useEffect } from "react";

interface FeatureBannerProps {
  featureKey: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function FeatureBanner({
  featureKey,
  title,
  description,
  actionText = "Compris",
  onAction
}: FeatureBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen this feature
    const hasSeenFeature = localStorage.getItem(`feature_seen_${featureKey}`);
    if (!hasSeenFeature) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [featureKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`feature_seen_${featureKey}`, "true");
    onAction?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in-up">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/25 p-5 border border-blue-400/30 backdrop-blur-sm">
        {/* Sparkle decoration */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xs">✨</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-400/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-white mb-1 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-blue-100 leading-relaxed mb-3">
              {description}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-white border border-white/20 hover:border-white/30"
              >
                {actionText}
              </button>
              <button
                onClick={handleDismiss}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors duration-200 text-blue-100 hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-2 right-8 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-6 right-4 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>
      </div>
    </div>
  );
}