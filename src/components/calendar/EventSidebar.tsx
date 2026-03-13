
"use client";
import { Event, FamilyMember } from "@/types";

interface Props {
  date: Date;
  events: Event[];
  members: FamilyMember[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  school: "📚", activity: "⚽", medical: "🏥", social: "🎉", other: "📌",
};

export default function EventSidebar({ date, events, members, onDelete, onAdd }: Props) {
  const dateLabel = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <aside className="event-sidebar" aria-label={`Events for ${dateLabel}`}>
      <div className="sidebar-date">
        <span className="sidebar-date-label" id="sidebar-date-label">{dateLabel}</span>
        <button type="button" className="sidebar-add-btn" onClick={onAdd} aria-label="Add event">+</button>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <span className="no-events-icon" aria-hidden>◎</span>
          <p>Nothing scheduled</p>
          <button type="button" className="add-first-btn" onClick={onAdd}>Add an event</button>
        </div>
      ) : (
        <ul className="event-list" role="list">
          {events.map((event) => {
            const member = members.find((m) => m.id === event.familyMemberId);
            return (
              <li key={event.id} className="event-card" style={{ borderLeftColor: member?.color || "#f59e0b" }}>
                <div className="event-card-top">
                  <span className="event-cat-icon" aria-hidden>{CATEGORY_ICONS[event.category] || "📌"}</span>
                  <span className="event-title">{event.title}</span>
                  <button type="button" className="event-delete" onClick={() => onDelete(event.id)} title="Delete" aria-label={`Delete ${event.title}`}>×</button>
                </div>
                <div className="event-meta">
                  {event.time && <span className="event-time">⏰ {event.time}</span>}
                  {event.location && <span className="event-loc">📍 {event.location}</span>}
                  {member && (
                    <span className="event-member" style={{ color: member.color }}>
                      ● {member.name}
                    </span>
                  )}
                  {event.source === "email" && <span className="event-source">✉ from email</span>}
                </div>
                {event.description && <p className="event-desc">{event.description}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
