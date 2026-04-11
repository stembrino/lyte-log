import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

type BadgeProps = {
  value: string | number;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  size?: "md" | "sm";
};

export function Badge({ value, textColor, borderColor, backgroundColor, size = "md" }: BadgeProps) {
  return (
    <View
      style={[
        styles.container,
        size === "sm" ? styles.containerSm : null,
        {
          borderColor,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.text, size === "sm" ? styles.textSm : null, { color: textColor }]}>
        {String(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 24,
    minWidth: 28,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  containerSm: {
    minHeight: 20,
    minWidth: 24,
    paddingHorizontal: 6,
  },
  text: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  textSm: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
