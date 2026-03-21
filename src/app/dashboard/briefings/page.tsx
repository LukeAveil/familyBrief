"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import { useBriefings } from "@/hooks/useBriefings";
import {
  getToday,
  getWeekStart,
  parseBriefingSections,
} from "@/lib/briefing";
import { getAccessToken } from "@/services/authClient";
import moment from "moment";
import { useCallback, useState } from "react";

/** Format full week range (Mon–Sun) e.g. "10–16 March 2025". */
function formatWeekRange(weekStart: Date): string {
  const mon = moment(weekStart);
  const sun = moment(weekStart).add(6, "days");
  const sameMonth = mon.month() === sun.month();
  const sameYear = mon.year() === sun.year();
  if (sameMonth && sameYear) {
    return `${mon.date()}–${sun.date()} ${sun.format("MMMM YYYY")}`;
  }
  if (sameYear) {
    return `${mon.format("D MMM")} – ${sun.format("D MMMM YYYY")}`;
  }
  return `${mon.format("D MMM YYYY")} – ${sun.format("D MMMM YYYY")}`;
}

function previewLine(content: string): string {
  const line = content.trim().split(/\r?\n/)[0] ?? "";
  return line.length > 100 ? `${line.slice(0, 97)}…` : line;
}

export default function BriefingsPage() {
  const {
    briefings,
    loading,
    error,
    refetch,
    currentBriefing,
    selectBriefing,
    selectedId,
    generateBriefing,
    generating,
    generateError,
  } = useBriefings();

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const today = getToday();
  const thisWeekStart = getWeekStart(today);
  const hasThisWeekBriefing = briefings.some((b) =>
    moment(b.weekStart).isSame(thisWeekStart, "day")
  );

  const sendFeedback = useCallback(
    async (sentiment: "up" | "down") => {
      if (!currentBriefing) return;
      setFeedbackMsg(null);
      const token = await getAccessToken();
      const res = await fetch("/api/observability/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          briefingId: currentBriefing.id,
          sentiment,
        }),
      });
      if (res.ok) {
        setFeedbackMsg("Thanks — we recorded your feedback.");
      } else {
        setFeedbackMsg("Could not send feedback. Try again later.");
      }
    },
    [currentBriefing]
  );

  const handleGenerate = async () => {
    try {
      await generateBriefing();
    } catch {
      /* handled via generateError */
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-shell">
          <h1 className="dash-name">Briefings</h1>
          <p className="dash-greeting">Loading your weekly briefings…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="dashboard-shell">
          <h1 className="dash-name">Briefings</h1>
          <ErrorMessage
            message={error.message || "Failed to load briefings."}
            onRetry={() => refetch()}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-shell">
        <h1 className="dash-name">Briefings</h1>
        <p className="dash-greeting">
          Your personalised week ahead — generated for your family and emailed to you.
        </p>

        <div className="briefings-toolbar">
          <button
            type="button"
            className="btn-briefing-cta"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            {generating
              ? "Generating your briefing…"
              : hasThisWeekBriefing
                ? "Regenerate this week"
                : "Generate this week's briefing"}
          </button>
          {hasThisWeekBriefing && (
            <button
              type="button"
              className="btn-briefing-secondary"
              onClick={() => void handleGenerate()}
              disabled={generating}
              title="Sends the latest briefing to your email again"
            >
              Send to email
            </button>
          )}
          <span className="briefings-email-note">
            Same action generates AI content, saves it, and emails you (if email delivery is configured).
          </span>
        </div>

        {generateError && (
          <p style={{ color: "#b91c1c", marginBottom: 16, fontSize: 14 }}>
            {generateError.message}
          </p>
        )}

        {briefings.length === 0 ? (
          <EmptyState
            icon="◎"
            title="No briefings yet"
            description="Generate your first weekly briefing for this calendar week. It uses your calendar events and is sent to your email."
            action={
              <button
                type="button"
                className="btn-briefing-cta"
                onClick={() => void handleGenerate()}
                disabled={generating}
              >
                {generating ? "Generating…" : "Generate this week's briefing"}
              </button>
            }
          />
        ) : (
          <div className="briefings-layout">
            <div className="briefings-main">
              {currentBriefing ? (
                <article className="briefings-main-card">
                  <h2 className="briefings-heading-week">
                    Week of {formatWeekRange(currentBriefing.weekStart)}
                  </h2>
                  <BriefingBody content={currentBriefing.content} />
                  <div className="briefing-feedback-row">
                    <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                      Was this helpful?
                    </span>
                    <button
                      type="button"
                      aria-label="Thumbs up"
                      onClick={() => void sendFeedback("up")}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      aria-label="Thumbs down"
                      onClick={() => void sendFeedback("down")}
                    >
                      👎
                    </button>
                    {feedbackMsg && (
                      <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                        {feedbackMsg}
                      </span>
                    )}
                  </div>
                </article>
              ) : null}
            </div>

            <aside className="briefings-sidebar">
              <div className="briefings-sidebar-title">History</div>
              <div className="briefings-sidebar-list">
                {briefings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`briefings-sidebar-item ${currentBriefing?.id === b.id ? "active" : ""}`}
                    onClick={() => selectBriefing(b.id)}
                  >
                    <div className="briefings-sidebar-date">
                      {formatWeekRange(b.weekStart)}
                    </div>
                    <div className="briefings-sidebar-preview">
                      {previewLine(b.content)}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function BriefingBody({ content }: { content: string }) {
  const sections = parseBriefingSections(content);
  if (sections.length === 0) {
    return (
      <div className="briefing-section-body" style={{ whiteSpace: "pre-wrap" }}>
        {content}
      </div>
    );
  }
  return (
    <div>
      {sections.map((sec, i) => (
        <div key={`${sec.title}-${i}`} className="briefing-section-block">
          {i > 0 && <hr className="briefing-section-rule" aria-hidden />}
          <h3 className="briefing-section-heading">{sec.title}</h3>
          <div className="briefing-section-body">{sec.body}</div>
        </div>
      ))}
    </div>
  );
}
