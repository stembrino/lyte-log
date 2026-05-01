import { useKeyboardAvoiding } from "@/components/hooks/useKeyboardAvoiding";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  iosBehavior?: "padding" | "height" | "position";
  iosOffset?: number;
  androidBehavior?: "padding" | "height" | "position";
  androidOffset?: number;
};

export function AppKeyboardAvoidingView({
  children,
  style,
  iosBehavior,
  iosOffset,
  androidBehavior,
  androidOffset,
}: Props) {
  const keyboardAvoiding = useKeyboardAvoiding({
    iosBehavior,
    iosOffset,
    androidBehavior,
    androidOffset,
  });

  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      enabled={keyboardAvoiding.enabled}
      behavior={keyboardAvoiding.behavior}
      keyboardVerticalOffset={keyboardAvoiding.keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
