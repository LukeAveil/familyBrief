"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { waitForPasswordRecoverySession } from "@/lib/waitForPasswordRecoverySession";
import {
  MIN_PASSWORD_LEN,
  UpdatePasswordCheckingView,
  UpdatePasswordExpiredView,
  UpdatePasswordFormView,
} from "./UpdatePasswordViews";

type Phase = "checking" | "ready" | "invalid";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    void (async () => {
      const result = await waitForPasswordRecoverySession(supabase, ac.signal);
      if (result === "aborted") {
        return;
      }
      setPhase(result);
    })();

    return () => ac.abort();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "checking") {
    return <UpdatePasswordCheckingView />;
  }

  if (phase === "invalid") {
    return (
      <UpdatePasswordExpiredView
        onRequestNewLink={() => router.push("/auth/reset-password")}
      />
    );
  }

  return (
    <UpdatePasswordFormView
      password={password}
      confirmPassword={confirmPassword}
      error={error}
      submitting={submitting}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
    />
  );
}
