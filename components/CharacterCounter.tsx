import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text } from "react-native";

type CharacterCounterProps = {
  currentLength: number;
  maxLength: number;
  color: string;
  accentColor?: string;
};

export function CharacterCounter({
  currentLength,
  maxLength,
  color,
  accentColor,
}: CharacterCounterProps) {
  const threshold = maxLength >= 100 ? 0.85 : 0.8;
  const counterColor =
    accentColor && currentLength >= Math.floor(maxLength * threshold) ? accentColor : color;

  return (
    <Text style={[styles.counter, { color: counterColor }]}>
      {currentLength}/{maxLength}
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontFamily: monoFont,
    fontSize: 11,
    textAlign: "right",
    letterSpacing: 0.3,
  },
});
