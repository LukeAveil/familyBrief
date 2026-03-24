"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get("email") ?? "";
  const mode = searchParams?.get("mode") ?? "";
  const isReset = mode === "reset";

  return (
    <AuthScreen stepGap={20}>
      <div className="ob-icon">✉️</div>
      <h1 className="ob-title">
        {isReset
          ? "Check your email for a password reset link"
          : "Check your email to confirm"}
      </h1>
      <p className="ob-subtitle">
        {isReset ? (
          <>
            We&apos;ve sent a password reset link
            {email ? ` to ${email}` : ""}. Open that email and follow the link
            to choose a new password.
          </>
        ) : (
          <>
            We&apos;ve sent a confirmation link
            {email ? ` to ${email}` : ""}. Please open that email and click the
            link so we can finish setting up your FamilyBrief account.
          </>
        )}
      </p>
      <ul className="ob-benefits">
        {isReset ? (
          <>
            <li>
              <span>📥</span>
              Look for an email from FamilyBrief in your inbox (and spam or junk,
              just in case).
            </li>
            <li>
              <span>🔗</span>
              Tap the reset link in that email — it opens a page where you can
              set a new password.
            </li>
            <li>
              <span>✅</span>
              After updating your password, you&apos;ll be signed in and can go
              to your dashboard.
            </li>
          </>
        ) : (
          <>
            <li>
              <span>📥</span>
              Look for an email from FamilyBrief in your inbox (and spam or
              junk, just in case).
            </li>
            <li>
              <span>🔗</span>
              Tap the confirmation link in that email to activate your account.
            </li>
            <li>
              <span>✅</span>
              Once confirmed, come back here and sign in to continue setting up
              your family.
            </li>
          </>
        )}
      </ul>
      <div className="ob-actions">
        <button
          type="button"
          className="ob-btn-secondary"
          onClick={() => router.push("/auth")}
        >
          Back to sign in
        </button>
      </div>
    </AuthScreen>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthScreen stepGap={20}>
          <p className="ob-subtitle">Loading…</p>
        </AuthScreen>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}

