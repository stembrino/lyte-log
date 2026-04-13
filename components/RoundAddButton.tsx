import { monoFont } from "@/constants/retroTheme";
import { Pressable, StyleSheet, Text } from "react-native";
import { useRetroPalette } from "./hooks/useRetroPalette";

type RoundAddButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  size?: "default" | "small";
  testID?: string;
};

export function RoundAddButton({
  onPress,
  accessibilityLabel,
  disabled = false,
  size = "default",
  testID = "round-add-button",
}: RoundAddButtonProps) {
  const palette = useRetroPalette();
  const isSmall = size === "small";

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSmall ? styles.buttonSmall : null,
        {
          borderColor: palette.accent,
          backgroundColor: disabled
            ? palette.listSelected
            : pressed
              ? palette.accentPressed
              : palette.accent,
          opacity: disabled ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.icon, isSmall ? styles.iconSmall : null, { color: palette.onAccent }]}>
        +
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  icon: {
    fontFamily: monoFont,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 24,
  },
  iconSmall: {
    fontSize: 20,
    lineHeight: 20,
  },
});
