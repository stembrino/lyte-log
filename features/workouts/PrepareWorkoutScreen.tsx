import { PrimaryButton } from "@/components/PrimaryButton";
import { Chip } from "@/components/Chip";
import { ControlledInfoHint } from "@/components/ControlledInfoHint";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { SelectGymModal } from "@/features/workouts/components/SelectGymModal";
import {
  PrepareWorkoutExercisesForm,
  type EditableWorkoutExercise,
} from "@/features/workouts/components/prepare/PrepareWorkoutExercisesForm";
import { PrepareWorkoutExercisePickerModal } from "@/features/workouts/components/prepare/PrepareWorkoutExercisePickerModal";
import type { ExerciseLibraryItem } from "@/features/exercises/hooks/usePaginatedExerciseLibrary";
import { startWorkout } from "@/features/workouts/dao/mutations/workoutMutations";
import { useGymPicker } from "@/features/workouts/hooks/useGymPicker";
import { useSelectedRoutine } from "@/features/workouts/hooks/useSelectedRoutine";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PrepareWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const { showAlert, alertElement } = useGlobalAlert();
  const params = useLocalSearchParams<{ routineId?: string | string[] }>();
  const routineIdParam = params.routineId;
  const routineId = Array.isArray(routineIdParam) ? routineIdParam[0] : routineIdParam;
  const [isGymModalOpen, setIsGymModalOpen] = useState(false);
  const [isGymInfoOpen, setIsGymInfoOpen] = useState(false);
  const [isExercisesInfoOpen, setIsExercisesInfoOpen] = useState(false);

  const { routine, loading } = useSelectedRoutine(routineId ?? null, locale);
  const {
    gyms,
    selectedGym,
    selectedGymId,
    setSelectedGymId,
    addGym,
    loading: loadingGyms,
  } = useGymPicker();
  const [editableExercises, setEditableExercises] = useState<EditableWorkoutExercise[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);

  useEffect(() => {
    if (!routine) {
      setEditableExercises([]);
      return;
    }

    setEditableExercises(
      routine.exercises.map((exercise, index) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        exerciseOrder: exercise.exerciseOrder ?? index + 1,
        setsTarget: exercise.setsTarget?.toString() || "3",
        repsTarget: exercise.repsTarget || "10",
      })),
    );
  }, [routine]);

  const handleReorderExercises = (nextItems: EditableWorkoutExercise[]) => {
    setEditableExercises(
      nextItems.map((exercise, index) => ({ ...exercise, exerciseOrder: index + 1 })),
    );
  };

  const handleAddExercise = (exercise: ExerciseLibraryItem) => {
    setEditableExercises((prev) => [
      ...prev,
      {
        id: `new-${exercise.id}`,
        exerciseId: exercise.id,
        name: exercise.name,
        exerciseOrder: prev.length + 1,
        setsTarget: "3",
        repsTarget: "10",
      },
    ]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setEditableExercises((prev) =>
      prev
        .filter((exercise) => exercise.id !== exerciseId)
        .map((exercise, index) => ({ ...exercise, exerciseOrder: index + 1 })),
    );
  };

  const handleUpdateExerciseField = (
    exerciseId: string,
    field: "setsTarget" | "repsTarget",
    value: string,
  ) => {
    const numericValue = value.replace(/\D+/g, "");
    const normalizedValue =
      field === "setsTarget" && numericValue.length > 0
        ? String(Math.min(99, Number.parseInt(numericValue, 10) || 0))
        : numericValue;

    setEditableExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: normalizedValue } : exercise,
      ),
    );
  };

  const handleStartWorkout = async () => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      const exerciseIdByRoutineExerciseId = new Map(
        (routine?.exercises ?? []).map((exercise) => [exercise.id, exercise.exerciseId]),
      );

      const payloadExercises = editableExercises
        .slice()
        .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
        .map((exercise) => {
          const exerciseId = exercise.exerciseId ?? exerciseIdByRoutineExerciseId.get(exercise.id);
          if (!exerciseId) {
            return null;
          }

          const parsedSets = Number.parseInt(exercise.setsTarget, 10);
          const normalizedSets = Number.isFinite(parsedSets) && parsedSets > 0 ? parsedSets : 0;

          const repsMatch = exercise.repsTarget.match(/\d+/);
          const parsedReps = repsMatch ? Number.parseInt(repsMatch[0], 10) : Number.NaN;
          const normalizedReps = Number.isFinite(parsedReps) && parsedReps > 0 ? parsedReps : 0;

          return {
            exerciseId,
            exerciseOrder: exercise.exerciseOrder,
            setsTarget: normalizedSets,
            repsTarget: normalizedReps,
          };
        })
        .filter(
          (
            exercise,
          ): exercise is {
            exerciseId: string;
            exerciseOrder: number;
            setsTarget: number;
            repsTarget: number;
          } => Boolean(exercise),
        );

      const result = await startWorkout({
        gymId: selectedGymId,
        sourceRoutineId: routineId ?? null,
        exercises: payloadExercises,
      });

      if (result.reusedActiveWorkout) {
        showAlert({
          title: t("workouts.activeWorkoutExistsTitle"),
          message: t("workouts.activeWorkoutExistsBody"),
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      }

      router.replace({
        pathname: "/workout-in-progress",
        params: {
          workoutId: result.workoutId,
        },
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.page }]}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>
        {t("workouts.prepareWorkoutTitle")}
      </Text>
      <View
        style={[styles.gymSection, { borderColor: palette.border, backgroundColor: palette.card }]}
      >
        <View style={styles.gymLabelRow}>
          <Text style={[styles.gymLabel, { color: palette.textPrimary }]}>
            {t("workouts.gymFieldLabel")}
          </Text>
          <ControlledInfoHint
            visible={isGymInfoOpen}
            onVisibleChange={setIsGymInfoOpen}
            message={t("workouts.gymFieldHint")}
            dismissLabel={t("routines.infoHintDismiss")}
            triggerAccessibilityLabel={t("workouts.gymFieldInfoButtonLabel")}
            tintColor={palette.accent}
            cardBackgroundColor={palette.card}
            borderColor={palette.border}
            textColor={palette.textPrimary}
            iconName="info"
          />
        </View>

        <View style={styles.gymSelectionRow}>
          <Chip
            label={selectedGym?.name ?? t("workouts.gymNotDefined")}
            selected={Boolean(selectedGymId)}
            onPress={() => setIsGymModalOpen(true)}
          />
          <TouchableOpacity
            style={[styles.gymSelectButton, { borderColor: palette.border }]}
            onPress={() => setIsGymModalOpen(true)}
          >
            <Text style={[styles.gymSelectButtonText, { color: palette.textPrimary }]}>
              {t("workouts.selectGymCta")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={[styles.statusText, { color: palette.textSecondary }]}>
          {t("routines.loading")}
        </Text>
      ) : (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {routine ? (
            <Text style={[styles.routineName, { color: palette.textPrimary }]}>{routine.name}</Text>
          ) : null}
          {routine && routine.detail ? (
            <Text style={[styles.routineDetail, { color: palette.textSecondary }]}>
              {routine.detail}
            </Text>
          ) : null}
          {routine && routine.description ? (
            <Text style={[styles.routineDescription, { color: palette.textSecondary }]}>
              {routine.description}
            </Text>
          ) : null}

          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              {t("routines.exercisesTitle")}
            </Text>
            <ControlledInfoHint
              visible={isExercisesInfoOpen}
              onVisibleChange={setIsExercisesInfoOpen}
              message={t("workouts.prepareWorkoutExercisesInfo")}
              dismissLabel={t("routines.infoHintDismiss")}
              triggerAccessibilityLabel={t("workouts.prepareWorkoutExercisesInfoButtonLabel")}
              tintColor={palette.accent}
              cardBackgroundColor={palette.card}
              borderColor={palette.border}
              textColor={palette.textPrimary}
              iconName="info"
            />
          </View>

          {editableExercises.length === 0 ? (
            <Text style={[styles.statusText, { color: palette.textSecondary }]}>
              {t("workouts.prepareWorkoutNoExercises")}
            </Text>
          ) : null}

          <PrepareWorkoutExercisesForm
            items={editableExercises}
            addButtonAccessibilityLabel={t("workouts.addExerciseAccessibilityLabel")}
            removeButtonLabel={t("routines.removeExerciseButton")}
            setsPlaceholder={t("routines.setsPlaceholder")}
            repsPlaceholder={t("routines.repsPlaceholder")}
            onReorder={handleReorderExercises}
            onRemoveExercise={handleRemoveExercise}
            onUpdateExerciseField={handleUpdateExerciseField}
            onPressAddExercise={() => setIsExercisePickerOpen(true)}
            palette={palette}
          />
        </View>
      )}

      <View style={[styles.actions, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: palette.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.secondaryActionText, { color: palette.textPrimary }]}>
              {t("workouts.cancelPreparationCta")}
            </Text>
          </TouchableOpacity>
          <PrimaryButton
            label={isStarting ? t("routines.loading") : t("workouts.startWorkoutCta")}
            onPress={() => {
              void handleStartWorkout();
            }}
          />
        </View>
      </View>

      <SelectGymModal
        isOpen={isGymModalOpen}
        onClose={() => setIsGymModalOpen(false)}
        gyms={gyms}
        selectedGymId={selectedGymId}
        loading={loadingGyms}
        title={t("workouts.selectGymModalTitle")}
        noneLabel={t("workouts.gymNoneOption")}
        addPlaceholder={t("workouts.gymAddPlaceholder")}
        addButtonLabel={t("workouts.gymAddButton")}
        emptyLabel={t("workouts.gymEmptyState")}
        onSelectGym={setSelectedGymId}
        onAddGym={addGym}
      />

      <PrepareWorkoutExercisePickerModal
        isOpen={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        locale={locale}
        excludeExerciseIds={editableExercises.map((exercise) => exercise.exerciseId ?? exercise.id)}
        onAddExercise={handleAddExercise}
        title={t("workouts.addExercisePickerTitle")}
        hint={t("workouts.addExercisePickerHint")}
        searchPlaceholder={t("routines.searchExercisePlaceholder")}
        addButtonLabel={t("routines.addExerciseButton")}
        emptyLabel={t("routines.noExerciseResults")}
        loadingLabel={t("routines.loading")}
      />

      {alertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  gymSection: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    gap: 8,
  },
  gymLabel: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  gymLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gymSelectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  gymSelectButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  gymSelectButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  card: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
  },
  routineName: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  routineDetail: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  routineDescription: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionTitleRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  actions: {
    marginTop: "auto",
    paddingTop: 8,
    paddingBottom: 12,
  },
  actionButtons: {
    gap: 10,
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
