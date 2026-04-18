import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import type { AppLocale } from "@/constants/translations";
import type { LogbookWorkoutItem } from "@/features/logbook/dao/queries/logbookQueries";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type LogbookWorkoutCardProps = {
  item: LogbookWorkoutItem;
  locale: AppLocale;
  durationLabel: string;
  exercisesLabel: string;
  setsLabel: string;
  completedLabel: string;
  totalLoadLabel: string;
  noSetDetailsLabel: string;
  setLabel: string;
  repsUnitSuffix: string;
  weightUnit: string;
  onEdit: (item: LogbookWorkoutItem) => void;
  onDelete: (id: string) => void;
};

function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatWorkoutDate(value: string, locale: AppLocale): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function LogbookWorkoutCard({
  item,
  locale,
  durationLabel,
  exercisesLabel,
  setsLabel,
  completedLabel,
  totalLoadLabel,
  noSetDetailsLabel,
  setLabel,
  repsUnitSuffix,
  weightUnit,
  onEdit,
  onDelete,
}: LogbookWorkoutCardProps) {
  const palette = useRetroPalette();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: palette.border,
          backgroundColor: palette.card,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.dateText, { color: palette.textPrimary }]}>
          {formatWorkoutDate(item.date, locale)}
        </Text>
        <Text style={[styles.durationText, { color: palette.accent }]}>
          {durationLabel}: {item.duration ?? 0}min
        </Text>
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <FontAwesome name="pencil" size={14} color={palette.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <FontAwesome name="trash-o" size={15} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.statsRow}>
        <Text style={[styles.statText, { color: palette.textSecondary }]}>
          {exercisesLabel}: {item.exerciseCount}
        </Text>
        <Text style={[styles.statText, { color: palette.textSecondary }]}>
          {setsLabel}: {item.totalSets}
        </Text>
        <Text style={[styles.statText, { color: palette.textSecondary }]}>
          {completedLabel}: {item.completedSets}/{item.totalSets}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.volumeRow}>
        <Text style={[styles.statText, { color: palette.textSecondary }]}>
          {totalLoadLabel}: {formatNumber(item.totalLoadKg, locale)}kg
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.setDetailsCol}>
        {item.setDetails.length === 0 ? (
          <Text style={[styles.setDetailText, { color: palette.textSecondary }]}>
            {noSetDetailsLabel}
          </Text>
        ) : (
          item.setDetails.map((set) => (
            <Text key={set.id} style={[styles.setDetailText, { color: palette.textSecondary }]}>
              {set.exerciseName} {setLabel} {set.setOrder}: {set.reps} {repsUnitSuffix} x{" "}
              {formatNumber(set.weight, locale)}
              {weightUnit}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dateText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  durationText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  volumeRow: {
    alignItems: "flex-start",
  },
  setDetailsCol: {
    gap: 4,
  },
  setDetailText: {
    fontFamily: monoFont,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  statText: {
    fontFamily: monoFont,
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
