import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { RoundAddButton } from "../RoundAddButton";

jest.mock("@/components/hooks/useRetroPalette", () => ({
  useRetroPalette: () => ({
    accent: "#E95420",
    accentPressed: "#C34113",
    onAccent: "#FFFFFF",
    listSelected: "#3A3A3A",
  }),
}));

describe("RoundAddButton", () => {
  it("renders the plus icon and calls onPress", () => {
    const onPress = jest.fn();

    const { getByLabelText, getByText } = render(
      <RoundAddButton accessibilityLabel="Add set" onPress={onPress} />,
    );

    expect(getByText("+")).toBeTruthy();

    fireEvent.press(getByLabelText("Add set"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();

    const { getByLabelText } = render(
      <RoundAddButton accessibilityLabel="Add set" onPress={onPress} disabled />,
    );

    fireEvent.press(getByLabelText("Add set"));

    expect(onPress).not.toHaveBeenCalled();
  });
});
