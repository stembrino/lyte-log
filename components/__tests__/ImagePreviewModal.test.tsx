import React from "react";
import { render } from "@testing-library/react-native";
import { ImagePreviewModal } from "../ImagePreviewModal";

jest.mock("@/components/hooks/useRetroPalette", () => ({
  useRetroPalette: () => ({
    textPrimary: "#FFFFFF",
    textSecondary: "#AAAAAA",
  }),
}));

jest.mock("@expo/vector-icons/FontAwesome", () => "MockFontAwesome");

describe("ImagePreviewModal", () => {
  it("returns null when imageSource is null", () => {
    const { queryByTestId, queryByText } = render(
      <ImagePreviewModal isOpen onClose={jest.fn()} imageSource={null} title="Bench Press" />,
    );

    expect(queryByTestId("image-preview")).toBeNull();
    expect(queryByText("Bench Press")).toBeNull();
  });

  it("renders title and image when opened with valid source", () => {
    const { getByTestId, getByText } = render(
      <ImagePreviewModal
        isOpen
        onClose={jest.fn()}
        imageSource={{ uri: "https://example.com/bench.png" }}
        title="Bench Press"
      />,
    );

    expect(getByText("Bench Press")).toBeTruthy();
    expect(getByTestId("image-preview")).toBeTruthy();
  });
});
