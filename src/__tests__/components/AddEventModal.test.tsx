import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddEventModal from "@/components/calendar/AddEventModal";
import { FamilyMember } from "@/types";

const defaultMembers: FamilyMember[] = [
  { id: "m1", userId: "u1", name: "Alex", role: "child", age: 10, color: "#f59e0b" },
];

describe("AddEventModal", () => {
  const selectedDate = new Date("2026-03-15");

  it("renders form with title and Add Event button", () => {
    render(
      <AddEventModal
        members={defaultMembers}
        selectedDate={selectedDate}
        onAdd={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: "Add Event" })).toBeInTheDocument();
    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Event" })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = jest.fn();
    render(
      <AddEventModal
        members={defaultMembers}
        selectedDate={selectedDate}
        onAdd={jest.fn()}
        onClose={onClose}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when modal close button is clicked", async () => {
    const onClose = jest.fn();
    render(
      <AddEventModal
        members={defaultMembers}
        selectedDate={selectedDate}
        onAdd={jest.fn()}
        onClose={onClose}
      />
    );
    const closeBtn = screen.getByRole("button", { name: "Close modal" });
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onAdd with form data when form is submitted", async () => {
    const onAdd = jest.fn().mockResolvedValue({});
    render(
      <AddEventModal
        members={defaultMembers}
        selectedDate={selectedDate}
        onAdd={onAdd}
        onClose={jest.fn()}
      />
    );
    await userEvent.type(screen.getByPlaceholderText(/e.g. Football practice/i), "Swim lesson");
    await userEvent.click(screen.getByRole("button", { name: "Add Event" }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Swim lesson",
        date: "2026-03-15",
        category: "other",
      })
    );
  });
});
