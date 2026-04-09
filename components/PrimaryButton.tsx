import { monoFont } from "@/constants/retroTheme";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRetroPalette } from "./hooks/useRetroPalette";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
}

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  const palette = useRetroPalette();

  const buttonStyles = useMemo(
    () => ({
      backgroundColor: palette.accent,
      backgroundColorPressed: palette.accentPressed,
      borderColor: palette.accent,
    }),
    [palette],
  );

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.primaryButton,
            {
              backgroundColor: pressed
                ? buttonStyles.backgroundColorPressed
                : buttonStyles.backgroundColor,
              borderColor: buttonStyles.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: "#ffffff",
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    borderRadius: 5,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: monoFont,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
