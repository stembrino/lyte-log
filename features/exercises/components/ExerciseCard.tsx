import { Badge } from "@/components/Badge";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ExerciseLibraryItem } from "../hooks/usePaginatedExerciseLibrary";

type Props = {
  item: ExerciseLibraryItem;
  expanded: boolean;
  onToggle: (itemId: string) => void;
  onEdit: (item: ExerciseLibraryItem) => void;
  onDelete: (item: ExerciseLibraryItem) => void;
};

export function ExerciseCard({ item, expanded, onToggle, onEdit, onDelete }: Props) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const sourceLabel = item.isCustom ? t("exercises.customBadge") : t("exercises.systemBadge");

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Pressable
        onPress={() => onToggle(item.id)}
        accessibilityLabel={
          expanded ? t("exercises.collapseExercise") : t("exercises.expandExercise")
        }
        style={({ pressed }) => [
          styles.header,
          { backgroundColor: pressed ? palette.listSelected : palette.card },
        ]}
      >
        <View style={styles.info}>
          <Text style={[styles.name, { color: palette.textPrimary }]}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Badge
              value={sourceLabel}
              textColor={item.isCustom ? palette.accent : palette.textSecondary}
              borderColor={item.isCustom ? palette.accent : palette.border}
              backgroundColor={palette.card}
              size="sm"
            />
            <Text style={[styles.muscleGroup, { color: palette.textSecondary }]}>
              {item.muscleGroup}
            </Text>
          </View>
        </View>

        <Text style={[styles.chevron, { color: palette.accent }]}>{expanded ? "-" : "+"}</Text>
      </Pressable>

      {expanded ? (
        <View style={[styles.content, { borderTopColor: palette.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
              {t("exercises.muscleGroup")}
            </Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {item.muscleGroup}
            </Text>
          </View>

          {!item.isCustom ? (
            <View style={styles.systemNotice}>
              <Text style={[styles.systemNoticeText, { color: palette.accent }]}>
                {t("exercises.systemReadOnlyNotice")}
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {item.isCustom ? (
              <Pressable
                style={[styles.actionButton, { borderColor: palette.border }]}
                onPress={() => onEdit(item)}
                accessibilityLabel={t("routines.editAction")}
              >
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>
                  {t("routines.editAction")}
                </Text>
              </Pressable>
            ) : null}

            {item.isCustom ? (
              <Pressable
                style={[styles.actionButton, { borderColor: palette.accent }]}
                onPress={() => onDelete(item)}
                accessibilityLabel={t("exercises.deleteExercise")}
              >
                <Text style={[styles.actionLabel, { color: palette.accent }]}>
                  {t("exercises.deleteExercise")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 2,
    overflow: "hidden",
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  name: {
    fontFamily: monoFont,
    fontSize: 15,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  muscleGroup: {
    fontFamily: monoFont,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chevron: {
    width: 16,
    textAlign: "center",
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    borderTopWidth: 1,
    padding: 12,
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailValue: {
    fontFamily: monoFont,
    fontSize: 14,
  },
  systemNotice: {
    paddingTop: 2,
  },
  systemNoticeText: {
    fontFamily: monoFont,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
