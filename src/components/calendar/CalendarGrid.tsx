
"use client";
import { Event, FamilyMember } from "@/types";

interface Props {
  events: Event[];
  members: FamilyMember[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  loading: boolean;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarGrid({ events, members, selectedDate, onSelectDate, loading }: Props) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  return (
    <div className="calendar-grid-wrap">
      <div className="cal-month-nav">
        <span className="cal-month-label">{MONTH_NAMES[month]} {year}</span>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell empty" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today.toISOString().split("T")[0];
          const isSelected = dateStr === selectedDate.toISOString().split("T")[0];
          const dayEvents = getEventsForDay(day);

          return (
            <button
              key={day}
              className={`cal-cell ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectDate(new Date(year, month, day))}
            >
              <span className="cal-day-num">{day}</span>
              <div className="cal-event-dots">
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <span
                    key={idx}
                    className="cal-dot"
                    style={{ background: e.familyMember?.color || "#f59e0b" }}
                    title={e.title}
                  />
                ))}
                {dayEvents.length > 3 && <span className="cal-dot-more">+{dayEvents.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
