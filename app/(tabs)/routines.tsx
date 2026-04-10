import { AppCard } from "@/components/AppCard";
import { Badge } from "@/components/Badge";
import { ExpandedPanel } from "@/components/ExpandedPanel";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useSystemRoutines } from "@/hooks/useSystemRoutines";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function RoutinesScreen() {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const { systemRoutines, loading } = useSystemRoutines();
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});

  const getRoutineLabel = (routine: { i18nKey: string | null; name: string }) =>
    routine.i18nKey ? t(`routines.library.${routine.i18nKey}`) : routine.name;

  const getTagLabel = (tag: { i18nKey: string }) => t(`routines.tags.${tag.i18nKey}`);

  const getExerciseLabel = (exercise: { i18nKey: string | null; name: string }) =>
    exercise.i18nKey ? t(`exerciseLibrary.${exercise.i18nKey}`) : exercise.name;

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutineIds((prev) => ({
      ...prev,
      [routineId]: !prev[routineId],
    }));
  };

  return (
    <ScrollView style={{ backgroundColor: palette.page }} contentContainerStyle={styles.container}>
      <Text style={[styles.description, { color: palette.textSecondary }]}>
        {t("routines.subtitle")}
      </Text>

      <AppCard
        title={t("routines.systemRoutines")}
        subtitle={t("routines.systemRoutinesHint")}
        rightAdornment={
          <Badge
            value={systemRoutines.length}
            textColor={palette.accent}
            borderColor={palette.accent}
            backgroundColor={palette.card}
          />
        }
      >
        {loading ? (
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {t("routines.loading")}
          </Text>
        ) : systemRoutines.length === 0 ? (
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {t("routines.emptySystemRoutines")}
          </Text>
        ) : (
          <View style={styles.list}>
            {systemRoutines.map((routine) => (
              <ExpandedPanel
                key={routine.id}
                title={getRoutineLabel(routine)}
                subtitle={t("routines.estimatedDuration", {
                  minutes: routine.estimatedDurationMin ?? 0,
                })}
                count={routine.exercises.length}
                expanded={Boolean(expandedRoutineIds[routine.id])}
                onToggle={() => toggleRoutine(routine.id)}
                style={styles.routineCard}
              >
                <View style={styles.tagsWrap}>
                  {routine.tags.map((tag) => (
                    <View
                      key={tag.id}
                      style={[
                        styles.tag,
                        { backgroundColor: palette.card, borderColor: palette.tagBorder },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: palette.tagText }]}>
                        {getTagLabel(tag)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.sectionDivider, { backgroundColor: palette.border }]} />

                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  {t("routines.exercisesTitle")}
                </Text>

                <View style={styles.exerciseList}>
                  {routine.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <Text style={[styles.exerciseIndex, { color: palette.accent }]}>
                        {String(exercise.exerciseOrder).padStart(2, "0")}
                      </Text>
                      <View style={styles.exerciseCopy}>
                        <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>
                          {getExerciseLabel(exercise)}
                        </Text>
                        <Text style={[styles.exerciseMeta, { color: palette.textSecondary }]}>
                          {exercise.setsTarget ?? "-"} x {exercise.repsTarget ?? "-"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ExpandedPanel>
            ))}
          </View>
        )}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  description: {
    fontFamily: monoFont,
    letterSpacing: 0.2,
  },
  emptyState: {
    marginTop: 16,
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  routineCard: {
    gap: 0,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: monoFont,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
  },
  sectionTitle: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  exerciseIndex: {
    width: 24,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  exerciseCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  exerciseMeta: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
