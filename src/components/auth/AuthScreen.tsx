"use client";

import type { ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
  /** Matches `ob-step` spacing used on auth flows (tighter for simple states). */
  stepGap?: number;
};

export function AuthScreen({ children, stepGap = 24 }: AuthScreenProps) {
  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="ob-step" style={{ gap: stepGap }}>
          {children}
        </div>
      </div>
    </div>
  );
}
