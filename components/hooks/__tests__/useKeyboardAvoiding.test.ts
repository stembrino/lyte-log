import { renderHook } from "@testing-library/react-native";

type HookLoadArgs = {
  os: "ios" | "android";
  topInset: number;
  options?: {
    iosBehavior?: "height" | "position" | "padding";
    iosOffset?: number;
    androidBehavior?: "height" | "position" | "padding";
    androidOffset?: number;
  };
};

function loadHook({ os, topInset, options }: HookLoadArgs) {
  jest.resetModules();

  jest.doMock("react-native", () => ({
    Platform: { OS: os },
  }));

  jest.doMock("react-native-safe-area-context", () => ({
    useSafeAreaInsets: () => ({
      top: topInset,
      right: 0,
      bottom: 0,
      left: 0,
    }),
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useKeyboardAvoiding } = require("@/components/hooks/useKeyboardAvoiding");
  const { result } = renderHook(() => useKeyboardAvoiding(options));

  return result.current;
}

describe("useKeyboardAvoiding", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns iOS defaults using top safe area inset", () => {
    const value = loadHook({ os: "ios", topInset: 32 });

    expect(value.enabled).toBe(true);
    expect(value.behavior).toBe("padding");
    expect(value.keyboardVerticalOffset).toBe(32);
  });

  it("applies iOS custom behavior and clamps negative offset to zero", () => {
    const value = loadHook({
      os: "ios",
      topInset: 4,
      options: { iosBehavior: "position", iosOffset: -6 },
    });

    expect(value.enabled).toBe(true);
    expect(value.behavior).toBe("position");
    expect(value.keyboardVerticalOffset).toBe(0);
  });

  it("disables Android KAV by default (softwareKeyboardLayoutMode=resize handles fullscreen modals)", () => {
    const value = loadHook({ os: "android", topInset: 24 });

    expect(value.enabled).toBe(false);
    expect(value.keyboardVerticalOffset).toBe(0);
  });

  it("enables Android KAV when androidBehavior is explicitly provided (bottom sheets)", () => {
    const value = loadHook({
      os: "android",
      topInset: 24,
      options: { androidBehavior: "position" },
    });

    expect(value.enabled).toBe(true);
    expect(value.behavior).toBe("position");
    expect(value.keyboardVerticalOffset).toBe(0);
  });
});
