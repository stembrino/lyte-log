import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

type BadgeProps = {
  value: string | number;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
};

export function Badge({ value, textColor, borderColor, backgroundColor }: BadgeProps) {
  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{String(value)}</Text>
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
  text: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
