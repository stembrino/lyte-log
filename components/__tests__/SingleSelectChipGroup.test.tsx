import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SingleSelectChipGroup } from "../SingleSelectChipGroup";

jest.mock("@/components/hooks/useRetroPalette", () => ({
  useRetroPalette: () => ({
    border: "#404040",
    accent: "#E95420",
    textSecondary: "#888888",
    card: "#2D2D2D",
    textPrimary: "#EAEAEA",
    listSelected: "#3A3A3A",
  }),
}));

describe("SingleSelectChipGroup", () => {
  it("renders options and calls onSelect", () => {
    const onSelect = jest.fn();

    const { getByText } = render(
      <SingleSelectChipGroup
        options={["Chest", "Back"]}
        selectedOption="Chest"
        onSelect={onSelect}
      />,
    );

    expect(getByText("[x] Chest")).toBeTruthy();
    expect(getByText("[ ] Back")).toBeTruthy();

    fireEvent.press(getByText("[ ] Back"));

    expect(onSelect).toHaveBeenCalledWith("Back");
  });

  it("shows empty message when no options", () => {
    const { getByText } = render(
      <SingleSelectChipGroup
        options={[]}
        selectedOption={null}
        onSelect={() => {}}
        emptyMessage="No options available"
      />,
    );

    expect(getByText("No options available")).toBeTruthy();
  });
});
