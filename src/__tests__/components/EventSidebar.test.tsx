import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventSidebar from "@/components/calendar/EventSidebar";
import { Event, FamilyMember } from "@/types";

const defaultMembers: FamilyMember[] = [
  { id: "m1", userId: "u1", name: "Alex", role: "child", age: 10, color: "#f59e0b" },
];

describe("EventSidebar", () => {
  const date = new Date("2026-03-15");

  it("shows empty state when no events", () => {
    render(
      <EventSidebar
        date={date}
        events={[]}
        members={defaultMembers}
        onDelete={jest.fn()}
        onAdd={jest.fn()}
      />
    );
    expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add an event/i })).toBeInTheDocument();
  });

  it("calls onAdd when Add an event is clicked", async () => {
    const onAdd = jest.fn();
    render(
      <EventSidebar
        date={date}
        events={[]}
        members={defaultMembers}
        onDelete={jest.fn()}
        onAdd={onAdd}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /add an event/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("calls onAdd when sidebar + button is clicked", async () => {
    const onAdd = jest.fn();
    render(
      <EventSidebar
        date={date}
        events={[]}
        members={defaultMembers}
        onDelete={jest.fn()}
        onAdd={onAdd}
      />
    );
    const plusButtons = screen.getAllByRole("button");
    const plusBtn = plusButtons.find((b) => b.textContent === "+");
    if (plusBtn) await userEvent.click(plusBtn);
    expect(onAdd).toHaveBeenCalled();
  });

  it("renders event list when events provided", () => {
    const events: Event[] = [
      {
        id: "e1",
        userId: "u1",
        familyMemberId: "m1",
        title: "Football practice",
        date: "2026-03-15",
        time: "17:00",
        category: "activity",
        source: "manual",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ];
    render(
      <EventSidebar
        date={date}
        events={events}
        members={defaultMembers}
        onDelete={jest.fn()}
        onAdd={jest.fn()}
      />
    );
    expect(screen.getByText("Football practice")).toBeInTheDocument();
    expect(screen.getByText("⏰ 17:00")).toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const events: Event[] = [
      {
        id: "e1",
        userId: "u1",
        familyMemberId: "m1",
        title: "Football",
        date: "2026-03-15",
        category: "activity",
        source: "manual",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ];
    const onDelete = jest.fn();
    render(
      <EventSidebar
        date={date}
        events={events}
        members={defaultMembers}
        onDelete={onDelete}
        onAdd={jest.fn()}
      />
    );
    const deleteBtn = screen.getByTitle("Delete");
    await userEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("e1");
  });
});
