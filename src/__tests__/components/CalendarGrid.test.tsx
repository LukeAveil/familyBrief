import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { Event, FamilyMember } from "@/types";

const defaultMembers: FamilyMember[] = [
  { id: "m1", userId: "u1", name: "Alex", role: "child", age: 10, color: "#f59e0b" },
];

describe("CalendarGrid", () => {
  it("renders month and year for selected date", () => {
    const selectedDate = new Date("2026-03-15");
    render(
      <CalendarGrid
        events={[]}
        members={defaultMembers}
        selectedDate={selectedDate}
        onSelectDate={jest.fn()}
        loading={false}
      />
    );
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it("renders day headers", () => {
    const selectedDate = new Date("2026-03-15");
    render(
      <CalendarGrid
        events={[]}
        members={defaultMembers}
        selectedDate={selectedDate}
        onSelectDate={jest.fn()}
        loading={false}
      />
    );
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
  });

  it("calls onSelectDate when a day cell is clicked", async () => {
    const selectedDate = new Date("2026-03-15");
    const onSelectDate = jest.fn();
    render(
      <CalendarGrid
        events={[]}
        members={defaultMembers}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        loading={false}
      />
    );
    const day15 = screen.getByText("15");
    await userEvent.click(day15);
    expect(onSelectDate).toHaveBeenCalledTimes(1);
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 2, 15));
  });

  it("shows event dots for days that have events", () => {
    const selectedDate = new Date("2026-03-15");
    const events: Event[] = [
      {
        id: "e1",
        userId: "u1",
        familyMemberId: "m1",
        familyMember: { id: "m1", name: "Alex", color: "#f59e0b" },
        title: "Football",
        date: "2026-03-15",
        category: "activity",
        source: "manual",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ];
    render(
      <CalendarGrid
        events={events}
        members={defaultMembers}
        selectedDate={selectedDate}
        onSelectDate={jest.fn()}
        loading={false}
      />
    );
    const cellWithDot = screen.getByTitle("Football");
    expect(cellWithDot).toBeInTheDocument();
  });
});
