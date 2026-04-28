import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ActionMenu } from "../ActionMenu";

jest.mock("@/components/hooks/useRetroPalette", () => ({
  useRetroPalette: () => ({
    border: "#404040",
    accent: "#E95420",
    textSecondary: "#888888",
    card: "#2D2D2D",
    textPrimary: "#EAEAEA",
    listSelected: "#3A3A3A",
    page: "#1D1D1D",
  }),
}));

jest.mock("@expo/vector-icons/FontAwesome", () => "MockFontAwesome");

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

describe("ActionMenu", () => {
  it("opens the menu and runs the selected action", () => {
    const onEdit = jest.fn();

    const { getByLabelText, getByText } = render(
      <ActionMenu
        accessibilityLabel="Open routine actions"
        dismissLabel="Close actions"
        actions={[
          {
            key: "edit",
            label: "Edit",
            onPress: onEdit,
          },
          {
            key: "delete",
            label: "Delete",
            onPress: jest.fn(),
            destructive: true,
          },
        ]}
      />,
    );

    fireEvent.press(getByLabelText("Open routine actions"));

    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();

    fireEvent.press(getByText("Edit"));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("closes the menu when dismiss is pressed", () => {
    const { getByLabelText, getByText, queryByText } = render(
      <ActionMenu
        accessibilityLabel="Open routine actions"
        dismissLabel="Close actions"
        actions={[
          {
            key: "edit",
            label: "Edit",
            onPress: jest.fn(),
          },
        ]}
      />,
    );

    fireEvent.press(getByLabelText("Open routine actions"));

    expect(getByText("Edit")).toBeTruthy();

    fireEvent.press(getByText("Close actions"));

    expect(queryByText("Edit")).toBeNull();
  });
});
