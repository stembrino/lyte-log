import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet } from "react-native";
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
          backgroundColor: pressed ? palette.listSelected : "transparent",
          opacity: disabled ? 0.7 : 1,
        },
      ]}
    >
      <FontAwesome name="plus" size={isSmall ? 16 : 20} color={palette.accent} />
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
});
