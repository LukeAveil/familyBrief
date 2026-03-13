"use client";
import { FormEvent, useState } from "react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";

export default function FamilyStandalonePage() {
  const { members, loading, error, refetch, addMember, adding } = useFamilyMembers();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"parent" | "child">("child");
  const [age, setAge] = useState<string>("");
  const [color, setColor] = useState<string>("#f59e0b");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addMember({
      name: name.trim(),
      role,
      age: age ? parseInt(age, 10) : undefined,
      color,
    });
    setSaving(false);
    setName("");
    setAge("");
  };

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="dashboard-shell">
          <header className="dash-header">
            <div className="dash-title">
              <span className="dash-greeting">Family</span>
              <h1 className="dash-name">Your Family Members</h1>
            </div>
          </header>

          <div className="dash-body">
            <div className="calendar-grid-wrap" style={{ maxWidth: 600 }}>
              {loading ? (
                <p className="dash-greeting">Loading family members...</p>
              ) : error ? (
                <ErrorMessage
                  message={error.message || "Could not load family members. Please try again."}
                  onRetry={() => refetch()}
                />
              ) : members.length === 0 ? (
                <EmptyState
                  icon="◎"
                  title="No family members yet"
                  description="Add your family members so events can be colour-coded for everyone."
                />
              ) : (
              <ul className="event-list">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="event-card"
                    style={{ borderLeftColor: m.color || "#f59e0b" }}
                  >
                    <div className="event-card-top">
                      <span className="event-title">{m.name}</span>
                    </div>
                    <div className="event-meta">
                      <span className="event-member" style={{ color: m.color }}>
                        ● {m.role === "parent" ? "Parent" : "Child"}
                      </span>
                      {m.age != null && (
                        <span className="event-time">Age {m.age}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              )}
            </div>

            <div className="event-sidebar">
            <h2 className="sidebar-date-label">Add a family member</h2>
            <p className="dash-greeting" style={{ marginBottom: 16 }}>
              Keep your calendar and Sunday briefings aligned with everyone in
              the family.
            </p>
            <form className="event-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "parent" | "child")}
                  >
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Age (optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Colour</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label="Colour used to represent this family member in the calendar"
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving || adding || !name.trim()}
                >
                  {saving || adding ? "Adding..." : "Add family member"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

