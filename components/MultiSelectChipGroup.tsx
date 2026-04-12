import { Chip } from "@/components/Chip";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

export type MultiSelectChipOption = {
  id: string;
  label: string;
};

type MultiSelectChipGroupProps = {
  options: MultiSelectChipOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  emptyMessage?: string;
};

export function MultiSelectChipGroup({
  options,
  selectedIds,
  onToggle,
  emptyMessage,
}: MultiSelectChipGroupProps) {
  const palette = useRetroPalette();

  if (options.length === 0) {
    if (!emptyMessage) {
      return null;
    }

    return <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{emptyMessage}</Text>;
  }

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Chip
          key={option.id}
          label={option.label}
          selected={selectedIds.has(option.id)}
          onPress={() => onToggle(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
