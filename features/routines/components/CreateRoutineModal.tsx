import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import {
  usePaginatedExerciseLibrary,
  type ExerciseLibraryItem,
} from "@/features/routines/hooks/usePaginatedExerciseLibrary";
import { useCallback, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BasicInfoScreen } from "./BasicInfoScreen";
import { ExercisePickerScreen } from "./ExercisePickerScreen";
import type { SelectedRoutineExercise } from "./types";

interface CreateRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (routineData: {
    name: string;
    estimatedDurationMin?: number;
    tagIds: string[];
    exercises: {
      exerciseId: string;
      exerciseOrder: number;
      setsTarget?: number;
      repsTarget?: number;
    }[];
  }) => void;
}

type Screen = "basic" | "exercises";

export function CreateRoutineModal({ visible, onClose, onSubmit }: CreateRoutineModalProps) {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();

  const [screen, setScreen] = useState<Screen>("basic");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedRoutineExercise[]>([]);

  const excludedExerciseIds = useMemo(
    () => selectedExercises.map((exercise) => exercise.exerciseId),
    [selectedExercises],
  );

  const getExerciseLabel = useCallback(
    (exercise: { i18nKey: string | null; name: string }) =>
      exercise.i18nKey ? t(`exerciseLibrary.${exercise.i18nKey}`) : exercise.name,
    [t],
  );

  const {
    items: pagedExercises,
    hasMore: hasMoreExercises,
    loadingInitial: loadingInitialExercises,
    loadingMore: loadingMoreExercises,
    loadMore: handleLoadMoreExercises,
  } = usePaginatedExerciseLibrary({
    query: searchQuery,
    locale,
    excludeIds: excludedExerciseIds,
  });

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const updated = new Set(prev);
      if (updated.has(tagId)) {
        updated.delete(tagId);
      } else {
        updated.add(tagId);
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (!name.trim()) return;
    setScreen("exercises");
  };

  const handleBack = () => {
    setScreen("basic");
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    const parsedDuration = duration ? parseInt(duration, 10) : undefined;

    onSubmit({
      name: name.trim(),
      estimatedDurationMin:
        typeof parsedDuration === "number" && Number.isFinite(parsedDuration)
          ? parsedDuration
          : undefined,
      tagIds: Array.from(selectedTags),
      exercises: selectedExercises.map((exercise) => {
        const parsedSets = parseInt(exercise.setsTarget, 10);
        const parsedReps = parseInt(exercise.repsTarget, 10);
        return {
          exerciseId: exercise.exerciseId,
          exerciseOrder: exercise.exerciseOrder,
          setsTarget: Number.isFinite(parsedSets) ? parsedSets : undefined,
          repsTarget: Number.isFinite(parsedReps) ? parsedReps : undefined,
        };
      }),
    });

    setName("");
    setDuration("");
    setSelectedTags(new Set());
    setSelectedExercises([]);
    setSearchQuery("");
    setScreen("basic");
  };

  const handleAddExercise = (exercise: ExerciseLibraryItem) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        i18nKey: exercise.i18nKey,
        exerciseOrder: prev.length + 1,
        setsTarget: "3",
        repsTarget: "10",
      },
    ]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev
        .filter((exercise) => exercise.exerciseId !== exerciseId)
        .map((exercise, index) => ({ ...exercise, exerciseOrder: index + 1 })),
    );
  };

  const handleUpdateExerciseField = (
    exerciseId: string,
    field: "setsTarget" | "repsTarget",
    value: string,
  ) => {
    setSelectedExercises((prev) =>
      prev.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, [field]: value } : exercise,
      ),
    );
  };

  const handleModalClose = () => {
    setName("");
    setDuration("");
    setSelectedTags(new Set());
    setSelectedExercises([]);
    setSearchQuery("");
    setScreen("basic");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleModalClose}
    >
      <View style={[styles.container, { backgroundColor: palette.page }]}>
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <TouchableOpacity onPress={handleModalClose}>
            <Text style={[styles.closeButton, { color: palette.textPrimary }]}>✕</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
            {screen === "basic" ? t("routines.createRoutine") : t("routines.addExercises")}
          </Text>

          <Text style={[styles.stepIndicator, { color: palette.textSecondary }]}>
            {screen === "basic" ? "1/2" : "2/2"}
          </Text>
        </View>

        {screen === "basic" ? (
          <BasicInfoScreen
            name={name}
            onChangeName={setName}
            duration={duration}
            onChangeDuration={setDuration}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            palette={palette}
            t={t}
          />
        ) : (
          <ExercisePickerScreen
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            selectedExercises={selectedExercises}
            onRemoveExercise={handleRemoveExercise}
            onUpdateExerciseField={handleUpdateExerciseField}
            getExerciseLabel={getExerciseLabel}
            pagedExercises={pagedExercises}
            hasMoreExercises={hasMoreExercises}
            loadingInitialExercises={loadingInitialExercises}
            loadingMoreExercises={loadingMoreExercises}
            onLoadMoreExercises={handleLoadMoreExercises}
            onAddExercise={handleAddExercise}
            palette={palette}
            t={t}
          />
        )}

        <View style={[styles.footer, { borderTopColor: palette.border }]}>
          {screen === "basic" && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: palette.border }]}
                onPress={handleModalClose}
              >
                <Text style={[styles.buttonText, { color: palette.textPrimary }]}>
                  {t("routines.cancelButton")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={handleNext}
                disabled={!name.trim()}
              >
                <Text style={[styles.buttonText, { color: palette.card }]}>
                  {t("routines.nextButton")} →
                </Text>
              </TouchableOpacity>
            </>
          )}

          {screen === "exercises" && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { borderColor: palette.border }]}
                onPress={handleBack}
              >
                <Text style={[styles.buttonText, { color: palette.textPrimary }]}>
                  ← {t("routines.backButton")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={handleCreate}
              >
                <Text style={[styles.buttonText, { color: palette.card }]}>
                  {t("routines.createButton")} ✓
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  closeButton: {
    fontSize: 24,
    padding: 8,
  },
  stepIndicator: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  button: {
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {
    flex: 1,
  },
  buttonText: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
