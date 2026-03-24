"use client";

import type { FormEvent } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";

export function UpdatePasswordCheckingView() {
  return (
    <AuthScreen stepGap={20}>
      <p className="ob-subtitle">Verifying link…</p>
    </AuthScreen>
  );
}

type UpdatePasswordExpiredViewProps = {
  onRequestNewLink: () => void;
};

export function UpdatePasswordExpiredView({
  onRequestNewLink,
}: UpdatePasswordExpiredViewProps) {
  return (
    <AuthScreen stepGap={20}>
      <div className="ob-icon">⚠️</div>
      <h1 className="ob-title">Link expired</h1>
      <p className="ob-subtitle">
        This link has expired. Request a new one.
      </p>
      <div className="ob-actions">
        <button
          type="button"
          className="ob-btn-secondary"
          onClick={onRequestNewLink}
        >
          Request new reset link
        </button>
      </div>
    </AuthScreen>
  );
}

const MIN_PASSWORD_LEN = 8;

type UpdatePasswordFormViewProps = {
  password: string;
  confirmPassword: string;
  error: string | null;
  submitting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function UpdatePasswordFormView({
  password,
  confirmPassword,
  error,
  submitting,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: UpdatePasswordFormViewProps) {
  return (
    <AuthScreen stepGap={24}>
      <div className="ob-icon">🔒</div>
      <h1 className="ob-title">Set a new password</h1>
      <p className="ob-subtitle">
        Choose a strong password for your FamilyBrief account.
      </p>

      <form
        onSubmit={onSubmit}
        className="event-form"
        style={{ marginTop: 8 }}
      >
        <div className="form-field">
          <label>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-field">
          <label>Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="btn-save" disabled={submitting}>
            {submitting ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </AuthScreen>
  );
}

export { MIN_PASSWORD_LEN };
