"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get("email") ?? "";

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="ob-step" style={{ gap: 20 }}>
          <div className="ob-icon">✉️</div>
          <h1 className="ob-title">Check your email to confirm</h1>
          <p className="ob-subtitle">
            We&apos;ve sent a confirmation link
            {email ? ` to ${email}` : ""}. Please open that email and click the
            link so we can finish setting up your FamilyBrief account.
          </p>
          <ul className="ob-benefits">
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
        </div>
      </div>
    </div>
  );
}

