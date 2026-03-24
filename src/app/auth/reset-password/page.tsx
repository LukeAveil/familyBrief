"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email.");
      setSubmitting(false);
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      router.push(
        `/auth/check-email?mode=reset&email=${encodeURIComponent(trimmedEmail)}`
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen stepGap={24}>
      <div className="ob-icon">🔑</div>
      <h1 className="ob-title">Reset your password</h1>
      <p className="ob-subtitle">
        Enter the email you use for FamilyBrief. We&apos;ll send you a link to
        choose a new password.
      </p>

      <form
        onSubmit={handleSubmit}
        className="event-form"
        style={{ marginTop: 8 }}
      >
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
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
            {submitting ? "Sending link…" : "Send reset link"}
          </button>
        </div>
      </form>

      <button
        type="button"
        className="ob-btn-ghost"
        onClick={() => router.push("/auth")}
      >
        Back to login
      </button>
    </AuthScreen>
  );
}
