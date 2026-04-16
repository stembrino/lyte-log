import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ControlledInfoHint } from "../ControlledInfoHint";

jest.mock("@expo/vector-icons/FontAwesome", () => "MockFontAwesome");

describe("ControlledInfoHint", () => {
  const baseProps = {
    onVisibleChange: jest.fn(),
    message: "You can reorder exercises before starting.",
    dismissLabel: "Close",
    triggerAccessibilityLabel: "Open exercises help",
    tintColor: "#16A34A",
    cardBackgroundColor: "#111111",
    borderColor: "#333333",
    textColor: "#FFFFFF",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the trigger and opens through the visibility callback", () => {
    const onVisibleChange = jest.fn();
    const { getByLabelText } = render(
      <ControlledInfoHint {...baseProps} visible={false} onVisibleChange={onVisibleChange} />,
    );

    fireEvent.press(getByLabelText("Open exercises help"));

    expect(onVisibleChange).toHaveBeenCalledWith(true);
  });

  it("renders the message and closes through the dismiss button when visible", () => {
    const onVisibleChange = jest.fn();
    const { getByText, getByLabelText } = render(
      <ControlledInfoHint {...baseProps} visible onVisibleChange={onVisibleChange} />,
    );

    expect(getByText("You can reorder exercises before starting.")).toBeTruthy();

    fireEvent.press(getByLabelText("Close"));

    expect(onVisibleChange).toHaveBeenCalledWith(false);
  });

  it("does not render the message when hidden", () => {
    const { queryByText } = render(<ControlledInfoHint {...baseProps} visible={false} />);

    expect(queryByText("You can reorder exercises before starting.")).toBeNull();
  });
});
