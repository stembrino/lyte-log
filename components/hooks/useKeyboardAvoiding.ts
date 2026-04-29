import { Platform, type KeyboardAvoidingViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UseKeyboardAvoidingOptions = {
  iosBehavior?: KeyboardAvoidingViewProps["behavior"];
  iosOffset?: number;
  androidBehavior?: KeyboardAvoidingViewProps["behavior"];
  androidOffset?: number;
};

export function useKeyboardAvoiding({
  iosBehavior = "padding",
  iosOffset = 0,
  androidBehavior,
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
