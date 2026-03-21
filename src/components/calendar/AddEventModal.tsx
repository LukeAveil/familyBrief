
"use client";
import { useState } from "react";
import { FamilyMember, Event } from "@/types";

interface Props {
  members: FamilyMember[];
  selectedDate: Date;
  onAdd: (event: Partial<Event>) => Promise<Event>;
  onClose: () => void;
}

type EventFormState = {
  title: string;
  date: string;
  time: string;
  location: string;
  category: Event["category"];
  familyMemberId: string;
  description: string;
};

export default function AddEventModal({ members, selectedDate, onAdd, onClose }: Props) {
  const [form, setForm] = useState<EventFormState>({
    title: "",
    date: selectedDate.toISOString().split("T")[0],
    time: "",
    location: "",
    category: "other",
    familyMemberId: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    await onAdd(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="add-event-heading">Add Event</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        <form onSubmit={handleSubmit} className="event-form" aria-labelledby="add-event-heading">
          <div className="form-field">
            <label htmlFor="add-event-title">Event name *</label>
            <input
              id="add-event-title"
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Football practice"
              aria-required="true"
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="add-event-date">Date</label>
              <input id="add-event-date" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="add-event-time">Time</label>
              <input id="add-event-time" type="time" value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="add-event-location">Location</label>
            <input id="add-event-location" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. School gym" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="add-event-category">Category</label>
              <select id="add-event-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Event["category"] })} aria-label="Event category">
                <option value="school">📚 School</option>
                <option value="activity">⚽ Activity</option>
                <option value="medical">🏥 Medical</option>
                <option value="social">🎉 Social</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="add-event-member">For</label>
              <select id="add-event-member" value={form.familyMemberId} onChange={(e) => setForm({ ...form, familyMemberId: e.target.value })} aria-label="Family member">
                <option value="">Everyone</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="add-event-notes">Notes</label>
            <textarea id="add-event-notes" value={form.description} rows={2}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any extra details..." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving} aria-busy={saving}>
              {saving ? "Saving..." : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
