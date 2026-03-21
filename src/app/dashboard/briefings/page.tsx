"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import { useBriefings } from "@/hooks/useBriefings";
import type { Event } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  school: "📚",
  activity: "⚽",
  medical: "🏥",
  social: "🎉",
  other: "📌",
};

/** Format full week range (Mon–Sun) e.g. "10–16 March 2025". */
function formatWeekRange(weekStart: string): string {
  const mon = new Date(weekStart + "T12:00:00");
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const sameMonth = mon.getMonth() === sun.getMonth();
  const sameYear = mon.getFullYear() === sun.getFullYear();
  if (sameMonth && sameYear) {
    return `${mon.getDate()}–${sun.getDate()} ${sun.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
  }
  if (sameYear) {
    return `${mon.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  return `${mon.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${sun.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
}

function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <ul className="event-list" role="list">
      {events
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
        .map((event) => (
          <li
            key={event.id}
            className="event-card"
            style={{
              borderLeftColor: event.familyMember?.color || "#f59e0b",
            }}
          >
            <div className="event-card-top">
              <span className="event-cat-icon" aria-hidden>
                {CATEGORY_ICONS[event.category] || "📌"}
              </span>
              <span className="event-title">{event.title}</span>
            </div>
            <div className="event-meta">
              <span className="event-date">
                {new Date(event.date + "T12:00:00").toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              {event.time && <span className="event-time">⏰ {event.time}</span>}
              {event.location && (
                <span className="event-loc">📍 {event.location}</span>
              )}
              {event.familyMember && (
                <span
                  className="event-member"
                  style={{ color: event.familyMember.color }}
                >
                  ● {event.familyMember.name}
                </span>
              )}
            </div>
            {event.description && (
              <p className="event-desc">{event.description}</p>
            )}
          </li>
        ))}
    </ul>
  );
}

export default function BriefingsPage() {
  const { briefings, loading, error, refetch } = useBriefings();

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

  if (briefings.length === 0) {
    return (
      <DashboardLayout>
        <div className="dashboard-shell">
          <h1 className="dash-name">Briefings</h1>
          <EmptyState
            icon="◎"
            title="No briefings yet"
            description="When you add the first event for a week, a briefing for that week will appear here. Add events from the calendar to get started."
            action={<a href="/dashboard" className="btn-save">Go to calendar</a>}
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
          Your weekly briefings. Each one shows all events for that week.
        </p>

        <div className="briefings-list">
          {briefings.map((b) => (
            <article
              key={b.id}
              className="briefing-card"
              aria-label={`Briefing for week ${formatWeekRange(b.weekStart)}`}
            >
              <header className="briefing-card-header">
                <h2 className="briefing-week">
                  Week {formatWeekRange(b.weekStart)}
                </h2>
              </header>
              <div className="briefing-content">
                <p className="briefing-text">{b.content}</p>
              </div>
              {b.events.length > 0 && (
                <section className="briefing-events">
                  <h3 className="briefing-events-title">
                    Events this week ({b.events.length})
                  </h3>
                  <EventList events={b.events} />
                </section>
              )}
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
