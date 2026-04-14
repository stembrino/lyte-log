import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { AvatarWithPreview } from "../AvatarWithPreview";

jest.mock("../Avatar", () => ({
  Avatar: ({ label }: { label: string }) => {
    const { Text } = require("react-native");
    return <Text>{label}</Text>;
  },
}));

const mockImagePreviewModal = jest.fn(() => null);

jest.mock("../ImagePreviewModal", () => ({
  ImagePreviewModal: (props: unknown) => mockImagePreviewModal(props),
}));

describe("AvatarWithPreview", () => {
  beforeEach(() => {
    mockImagePreviewModal.mockClear();
  });

  it("renders only avatar when there is no imageSource", () => {
    const { getByText, queryByTestId } = render(<AvatarWithPreview label="Bench Press" />);

    expect(getByText("Bench Press")).toBeTruthy();
    expect(queryByTestId("avatar-preview-trigger")).toBeNull();
    expect(mockImagePreviewModal).not.toHaveBeenCalled();
  });

  it("opens preview modal after pressing avatar when image exists", () => {
    const { getByTestId } = render(
      <AvatarWithPreview
        label="Bench Press"
        imageSource={{ uri: "https://example.com/bench.png" }}
        previewTitle="Bench Press"
      />,
    );

    const trigger = getByTestId("avatar-preview-trigger");

    fireEvent.press(trigger);

    const lastCallProps = mockImagePreviewModal.mock.calls.at(-1)?.[0] as {
      isOpen: boolean;
      title?: string;
    };

    expect(lastCallProps?.title).toBe("Bench Press");
    expect(lastCallProps?.isOpen).toBe(true);
  });
});
