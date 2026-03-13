import { create } from "zustand";

type UiState = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

const todayIso = new Date().toISOString().split("T")[0];

export const useUiStore = create<UiState>((set) => ({
  selectedDate: todayIso,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));

