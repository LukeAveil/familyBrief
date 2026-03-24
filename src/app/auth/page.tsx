"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(trimmedEmail, password);
        if (result.error) {
          setError(result.error);
        } else {
          router.push(
            `/auth/check-email?email=${encodeURIComponent(trimmedEmail)}`
          );
        }
      } else {
        const result = await signInWithEmail(trimmedEmail, password);
        if (result.error) {
          setError(result.error);
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen stepGap={24}>
      <div className="ob-icon">🗓️</div>
      <h1 className="ob-title">
        {mode === "signup" ? "Create your FamilyBrief" : "Welcome back"}
      </h1>
      <p className="ob-subtitle">
        {mode === "signup"
          ? "Sign up in under a minute. It’s free while we’re in beta."
          : "Sign in to your family’s calendar and weekly briefings."}
      </p>

      <div
        className="auth-toggle"
        role="tablist"
        aria-label="Choose to create an account or sign in"
      >
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`auth-toggle-btn${
            mode === "signup" ? " is-active" : ""
          }`}
          aria-pressed={mode === "signup"}
        >
          I&apos;m new here
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`auth-toggle-btn${mode === "login" ? " is-active" : ""}`}
          aria-pressed={mode === "login"}
        >
          I already have an account
        </button>
      </div>

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

        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
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
            {submitting
              ? mode === "signup"
                ? "Creating account..."
                : "Signing in..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </div>
      </form>

      {mode === "login" && (
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <Link
            href="/auth/reset-password"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              textDecoration: "underline",
            }}
          >
            Forgot password?
          </Link>
        </div>
      )}

      <button
        type="button"
        className="ob-btn-ghost"
        onClick={() => router.push("/")}
      >
        Back to home
      </button>
    </AuthScreen>
  );
}

