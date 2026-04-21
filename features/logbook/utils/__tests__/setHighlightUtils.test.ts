import { getHighlightedSetIds } from "../setHighlightUtils";
import type { LogbookWorkoutItem } from "@/features/logbook/dao/queries/logbookQueries";

describe("getHighlightedSetIds", () => {
  it("should return empty set for empty input", () => {
    const result = getHighlightedSetIds([]);
    expect(result.size).toBe(0);
  });

  it("should highlight single set", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      { id: "1", exerciseName: "Legpress", weight: 80, reps: 10, setOrder: 1, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("1")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("should highlight set with maximum weight", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      { id: "1", exerciseName: "Legpress", weight: 80, reps: 10, setOrder: 1, completed: true },
      { id: "2", exerciseName: "Legpress", weight: 100, reps: 10, setOrder: 2, completed: true },
      { id: "3", exerciseName: "Legpress", weight: 90, reps: 10, setOrder: 3, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("2")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("should highlight set with most reps when weight is same", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      { id: "1", exerciseName: "Legpress", weight: 90, reps: 8, setOrder: 1, completed: true },
      { id: "2", exerciseName: "Legpress", weight: 90, reps: 10, setOrder: 2, completed: true },
      { id: "3", exerciseName: "Legpress", weight: 90, reps: 6, setOrder: 3, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("2")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("should highlight last set when weight and reps are identical", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      { id: "1", exerciseName: "Legpress", weight: 90, reps: 10, setOrder: 1, completed: true },
      { id: "2", exerciseName: "Legpress", weight: 90, reps: 10, setOrder: 2, completed: true },
      { id: "3", exerciseName: "Legpress", weight: 90, reps: 6, setOrder: 3, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("2")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("should highlight best set per exercise for multiple exercises", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      { id: "1", exerciseName: "Legpress", weight: 80, reps: 10, setOrder: 1, completed: true },
      { id: "2", exerciseName: "Legpress", weight: 100, reps: 10, setOrder: 2, completed: true },
      { id: "3", exerciseName: "Squats", weight: 60, reps: 8, setOrder: 1, completed: true },
      { id: "4", exerciseName: "Squats", weight: 60, reps: 12, setOrder: 2, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("2")).toBe(true); // Legpress: 100kg
    expect(result.has("4")).toBe(true); // Squats: 12 reps at 60kg
    expect(result.size).toBe(2);
  });

  it("should prioritize weight over reps", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      { id: "1", exerciseName: "Benchpress", weight: 100, reps: 5, setOrder: 1, completed: true },
      { id: "2", exerciseName: "Benchpress", weight: 80, reps: 15, setOrder: 2, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("1")).toBe(true); // Higher weight wins
    expect(result.size).toBe(1);
  });

  it("should handle complex multi-exercise scenario", () => {
    const setDetails: LogbookWorkoutItem["setDetails"] = [
      // Legpress: 10x90, 10x90, 6x90 -> should highlight 2nd (last with 10x90)
      { id: "1", exerciseName: "Legpress", weight: 90, reps: 10, setOrder: 1, completed: true },
      { id: "2", exerciseName: "Legpress", weight: 90, reps: 10, setOrder: 2, completed: true },
      { id: "3", exerciseName: "Legpress", weight: 90, reps: 6, setOrder: 3, completed: true },
      // Squats: 8x70, 8x70 -> should highlight 2nd (last)
      { id: "4", exerciseName: "Squats", weight: 70, reps: 8, setOrder: 1, completed: true },
      { id: "5", exerciseName: "Squats", weight: 70, reps: 8, setOrder: 2, completed: true },
    ];
    const result = getHighlightedSetIds(setDetails);
    expect(result.has("2")).toBe(true); // Legpress
    expect(result.has("5")).toBe(true); // Squats
    expect(result.size).toBe(2);
  });
});
