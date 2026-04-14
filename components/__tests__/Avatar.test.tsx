import React from "react";
import { render } from "@testing-library/react-native";
import { Avatar } from "../Avatar";

jest.mock("@/components/hooks/useRetroPalette", () => ({
  useRetroPalette: () => ({
    border: "#222222",
    listSelected: "#111111",
    textPrimary: "#FFFFFF",
  }),
}));

describe("Avatar", () => {
  it("renders initials when there is no image", () => {
    const { getByText, queryByTestId } = render(<Avatar label="Bench Press" />);

    expect(getByText("BP")).toBeTruthy();
    expect(queryByTestId("avatar-image")).toBeNull();
  });

  it("renders the image when imageUrl is provided", () => {
    const { getByTestId, queryByText } = render(
      <Avatar label="Bench Press" imageSource={{ uri: "https://example.com/bench.png" }} />,
    );

    expect(getByTestId("avatar-image")).toBeTruthy();
    expect(queryByText("BP")).toBeNull();
  });
});
