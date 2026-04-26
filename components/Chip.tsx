import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: "md" | "sm";
};

export function Chip({ label, selected = false, onPress, size = "md" }: ChipProps) {
  const palette = useRetroPalette();
  const isSm = size === "sm";

  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole={onPress ? "button" : undefined}>
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            isSm ? styles.containerSm : styles.containerMd,
            {
              borderColor: selected ? palette.accent : palette.border,
              backgroundColor: selected
                ? palette.accent
                : pressed
                  ? palette.listSelected
                  : palette.card,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              isSm ? styles.textSm : styles.textMd,
              { color: selected ? palette.onAccent : palette.textPrimary },
            ]}
          >
            {selected ? "[x] " : "[ ] "}
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  containerMd: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  containerSm: {
    minHeight: 26,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  text: {
    fontFamily: monoFont,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  textMd: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  textSm: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
