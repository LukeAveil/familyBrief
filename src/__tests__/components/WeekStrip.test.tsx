import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeekStrip from "@/components/calendar/WeekStrip";
import { Event } from "@/types";

describe("WeekStrip", () => {
  it("calls onSelectDate when a day is clicked", async () => {
    const today = new Date("2026-03-13T00:00:00.000Z");
    const onSelectDate = jest.fn();
    const events: Event[] = [];

    render(
      <WeekStrip
        selectedDate={today}
        onSelectDate={onSelectDate}
        events={events}
      />
    );

    const user = userEvent.setup();
    const wedButton = screen.getByText("Wed");
    await user.click(wedButton);

    expect(onSelectDate).toHaveBeenCalled();
  });
});

