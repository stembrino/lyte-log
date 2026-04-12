import { Chip } from "@/components/Chip";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

type SingleSelectChipGroupProps = {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  error?: boolean;
  emptyMessage?: string;
};

export function SingleSelectChipGroup({
  options,
  selectedOption,
  onSelect,
  error = false,
  emptyMessage,
}: SingleSelectChipGroupProps) {
  const palette = useRetroPalette();

  return (
    <View style={styles.wrapper}>
      <View
        accessibilityRole="radiogroup"
        style={[
          styles.container,
          {
            borderColor: error ? palette.accent : palette.border,
          },
        ]}
      >
        {options.map((option) => {
          const selected = selectedOption === option;

          return (
            <Chip
              key={option}
              label={option}
              selected={selected}
              onPress={() => onSelect(option)}
            />
          );
        })}
      </View>

      {options.length === 0 && emptyMessage ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{emptyMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  container: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 8,
    gap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
