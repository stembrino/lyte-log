import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { GlobalAlertModal } from "../GlobalAlertModal";

jest.mock("@/components/hooks/useRetroPalette", () => ({
  useRetroPalette: () => ({
    card: "#1A1A1A",
    page: "#111111",
    border: "#333333",
    textPrimary: "#FFFFFF",
    textSecondary: "#CCCCCC",
    accent: "#16A34A",
  }),
}));

describe("GlobalAlertModal", () => {
  it("renders title and message when visible", () => {
    const { getByText } = render(
      <GlobalAlertModal
        visible
        title="Remove exercise"
        message="Do you want to remove this exercise?"
        actions={[{ label: "Cancel" }, { label: "Remove", variant: "destructive" }]}
      />,
    );

    expect(getByText("Remove exercise")).toBeTruthy();
    expect(getByText("Do you want to remove this exercise?")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Remove")).toBeTruthy();
  });

  it("does not render content when hidden", () => {
    const { queryByText } = render(
      <GlobalAlertModal
        visible={false}
        title="Title"
        message="Message"
        actions={[{ label: "OK" }]}
      />,
    );

    expect(queryByText("Title")).toBeNull();
    expect(queryByText("Message")).toBeNull();
  });

  it("fires action callbacks", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    const { getByText } = render(
      <GlobalAlertModal
        visible
        title="Finish workout"
        message="Are you sure?"
        actions={[
          { label: "Cancel", onPress: onCancel },
          { label: "Finish", onPress: onConfirm },
        ]}
      />,
    );

    fireEvent.press(getByText("Cancel"));
    fireEvent.press(getByText("Finish"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
