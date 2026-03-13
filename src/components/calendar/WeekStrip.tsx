
"use client";
import { Event } from "@/types";

interface Props {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  events: Event[];
}

export default function WeekStrip({ selectedDate, onSelectDate, events }: Props) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + 1);
    return d;
  });

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="week-strip">
      {days.map((day, i) => {
        const dateStr = day.toISOString().split("T")[0];
        const isToday = dateStr === today.toISOString().split("T")[0];
        const isSelected = dateStr === selectedDate.toISOString().split("T")[0];
        const dayEvents = events.filter((e) => e.date === dateStr);

        return (
          <button
            key={i}
            className={`week-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
            onClick={() => onSelectDate(day)}
          >
            <span className="wd-label">{DAY_LABELS[i]}</span>
            <span className="wd-num">{day.getDate()}</span>
            {dayEvents.length > 0 && (
              <span className="wd-dot" style={{ background: dayEvents[0].familyMember?.color || "#f59e0b" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
