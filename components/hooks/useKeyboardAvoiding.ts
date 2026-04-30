import { Platform, type KeyboardAvoidingViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UseKeyboardAvoidingOptions = {
  iosBehavior?: KeyboardAvoidingViewProps["behavior"];
  iosOffset?: number;
  androidBehavior?: KeyboardAvoidingViewProps["behavior"];
  androidOffset?: number;
};

// On Android, fullscreen modals rely on softwareKeyboardLayoutMode="resize" (app.config.ts)
// and do NOT need KeyboardAvoidingView — passing androidBehavior explicitly enables it
// only for overlay bottom-sheets where the OS resize does not apply.
export function useKeyboardAvoiding({
  iosBehavior = "padding",
  iosOffset = 0,
  androidBehavior = undefined,
  androidOffset = 0,
}: UseKeyboardAvoidingOptions = {}) {
  const insets = useSafeAreaInsets();
  const isIos = Platform.OS === "ios";

  return {
    enabled: isIos || Boolean(androidBehavior),
    behavior: isIos ? iosBehavior : androidBehavior,
    keyboardVerticalOffset: isIos ? Math.max(0, insets.top + iosOffset) : androidOffset,
  } satisfies Pick<KeyboardAvoidingViewProps, "enabled" | "behavior" | "keyboardVerticalOffset">;
}
