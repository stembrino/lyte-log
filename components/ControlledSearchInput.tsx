import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type ControlledSearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  variant?: "default" | "compact";
  testID?: string;
};

export function ControlledSearchInput({
  value,
  onChangeText,
  placeholder,
  variant = "default",
  testID,
}: ControlledSearchInputProps) {
  const palette = useRetroPalette();
  const [focused, setFocused] = useState(false);

  const isCompact = variant === "compact";

  const containerStyle = useMemo(
    () => [
      styles.container,
      isCompact ? styles.containerCompact : styles.containerDefault,
      {
        backgroundColor: palette.inputBg,
        borderColor: !isCompact && focused ? palette.accent : palette.inputBorder,
        borderWidth: !isCompact && focused ? 2 : 1,
      },
    ],
    [focused, isCompact, palette.accent, palette.inputBg, palette.inputBorder],
  );

  return (
    <View style={containerStyle} testID={testID ?? "controlled-search-input-container"}>
      <FontAwesome name="search" size={14} color={palette.textSecondary} />
      <TextInput
        testID="controlled-search-input-field"
        style={[styles.input, { color: palette.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={palette.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  containerDefault: {
    borderRadius: 2,
  },
  containerCompact: {
    borderRadius: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
  },
});
