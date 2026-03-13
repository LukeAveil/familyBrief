
"use client";
import { useState } from "react";
import { FamilyMember, Event } from "@/types";

interface Props {
  members: FamilyMember[];
  selectedDate: Date;
  onAdd: (event: Partial<Event>) => Promise<Event>;
  onClose: () => void;
}

export default function AddEventModal({ members, selectedDate, onAdd, onClose }: Props) {
  const [form, setForm] = useState({
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
          <h2>Add Event</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-field">
            <label>Event name *</label>
            <input
              required autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Football practice"
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Date</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Time</label>
              <input type="time" value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="form-field">
            <label>Location</label>
            <input value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. School gym" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="school">📚 School</option>
                <option value="activity">⚽ Activity</option>
                <option value="medical">🏥 Medical</option>
                <option value="social">🎉 Social</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>For</label>
              <select value={form.familyMemberId} onChange={(e) => setForm({ ...form, familyMemberId: e.target.value })}>
                <option value="">Everyone</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Notes</label>
            <textarea value={form.description} rows={2}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any extra details..." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving..." : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
