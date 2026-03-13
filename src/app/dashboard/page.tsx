"use client";
import { useEvents } from "@/hooks/useEvents";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventSidebar from "@/components/calendar/EventSidebar";
import AddEventModal from "@/components/calendar/AddEventModal";
import DashboardLayout from "@/components/layout/DashboardLayout";
import WeekStrip from "@/components/calendar/WeekStrip";
import { useUiStore } from "@/stores/uiStore";
import { useState } from "react";

export default function DashboardPage() {
  const today = new Date();
  const { selectedDate, setSelectedDate } = useUiStore();
  const selectedDateObj = new Date(selectedDate || today.toISOString().split("T")[0]);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 2,
    0
  )
    .toISOString()
    .split("T")[0];

  const { events, loading, unauthorized, addEvent, deleteEvent } =
    useEvents(monthStart, monthEnd);
  const { members } = useFamilyMembers();

  if (unauthorized) {
    return (
      <DashboardLayout>
        <div className="dashboard-shell">
          <div className="no-events">
            <p>
              You’re not signed in. Go to <a href="/auth">/auth</a> to log in.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedDateEvents = events.filter((e) => e.date === selectedDate);

  return (
    <DashboardLayout>
      <div className="dashboard-shell">
        <header className="dash-header">
          <div className="dash-title">
            <span className="dash-greeting">Good morning,</span>
            <h1 className="dash-name">The Family Brief</h1>
          </div>
          <button className="add-btn" onClick={() => setShowAddEvent(true)}>
            <span>+</span> Add Event
          </button>
        </header>

        <WeekStrip
          selectedDate={selectedDateObj}
          onSelectDate={(d) =>
            setSelectedDate(d.toISOString().split("T")[0])
          }
          events={events}
        />

        <div className="dash-body">
          <CalendarGrid
            events={events}
            members={members}
            selectedDate={selectedDateObj}
            onSelectDate={(d) =>
              setSelectedDate(d.toISOString().split("T")[0])
            }
            loading={loading}
          />
          <EventSidebar
            date={selectedDateObj}
            events={selectedDateEvents}
            members={members}
            onDelete={deleteEvent}
            onAdd={() => setShowAddEvent(true)}
          />
        </div>

        {showAddEvent && (
          <AddEventModal
            members={members}
            selectedDate={selectedDateObj}
            onAdd={addEvent}
            onClose={() => setShowAddEvent(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
