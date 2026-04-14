import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const palette = useRetroPalette();

  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole={onPress ? "button" : undefined}>
      {({ pressed }) => (
        <View
          style={[
            styles.container,
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
          <Text style={[styles.text, { color: selected ? palette.onAccent : palette.textPrimary }]}>
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
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
