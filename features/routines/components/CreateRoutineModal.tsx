import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";
import { useI18n } from "@/components/providers/i18n-provider";
import { WindowControlButton } from "@/components/WindowControlButton";
import { monoFont } from "@/constants/retroTheme";
import {
  usePaginatedExerciseLibrary,
  type ExerciseLibraryItem,
} from "@/features/exercises/hooks/usePaginatedExerciseLibrary";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreateExerciseModal } from "@/features/exercises/components/CreateExerciseModal";
import { useExerciseMutations } from "@/features/exercises/hooks/useExerciseMutations";
import { useMuscleGroups } from "@/features/exercises/hooks/useMuscleGroups";
import { BasicInfoScreen } from "./BasicInfoScreen";
import { ExercisePickerScreen } from "./ExercisePickerScreen";
import type { SelectedRoutineExercise } from "./types";

interface CreateRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  initialValues?: RoutineFormInitialValues | null;
  onSubmit: (routineData: RoutineSubmitPayload) => Promise<void>;
}

type Screen = "basic" | "exercises";

export type RoutineSubmitPayload = {
  name: string;
  detail?: string;
  description?: string;
  tagIds: string[];
  exercises: {
    exerciseId: string;
    exerciseOrder: number;
    setsTarget?: number;
    repsTarget?: number;
  }[];
};

export type RoutineFormInitialValues = {
  name: string;
  detail: string;
  description: string;
  tagIds: string[];
  exercises: SelectedRoutineExercise[];
};

export function CreateRoutineModal({
  visible,
  onClose,
  mode = "create",
  initialValues,
  onSubmit,
}: CreateRoutineModalProps) {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const { showConfirm, alertElement } = useGlobalAlert();
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>("basic");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [detail, setDetail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedRoutineExercise[]>([]);
  const [createExerciseModalVisible, setCreateExerciseModalVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(initialValues?.name ?? "");
    setDetail(initialValues?.detail ?? "");
    setDescription(initialValues?.description ?? "");
    setSelectedTags(new Set(initialValues?.tagIds ?? []));
    setSelectedExercises(initialValues?.exercises ?? []);
    setSearchQuery("");
    setScreen("basic");
  }, [visible, initialValues]);

  const excludedExerciseIds = useMemo(
    () => selectedExercises.map((exercise) => exercise.exerciseId),
    [selectedExercises],
  );

  const getExerciseLabel = useCallback((exercise: { name: string }) => exercise.name, []);

  const {
    items: pagedExercises,
    hasMore: hasMoreExercises,
    loadingInitial: loadingInitialExercises,
    loadingMore: loadingMoreExercises,
    loadMore: handleLoadMoreExercises,
    reload,
  } = usePaginatedExerciseLibrary({
    query: searchQuery,
    locale,
    excludeIds: excludedExerciseIds,
    muscleGroups: [],
  });
  const { items: muscleGroups } = useMuscleGroups();
  const { createExercise } = useExerciseMutations(reload);

  const hasUnsavedChanges = useMemo(() => {
    const initialName = initialValues?.name ?? "";
    const initialDetail = initialValues?.detail ?? "";
    const initialDescription = initialValues?.description ?? "";
    const initialTagIds = initialValues?.tagIds ?? [];
    const initialExercises = initialValues?.exercises ?? [];

    if (name !== initialName) return true;
    if (detail !== initialDetail) return true;
    if (description !== initialDescription) return true;

    if (selectedTags.size !== initialTagIds.length) return true;
    for (const tagId of initialTagIds) {
      if (!selectedTags.has(tagId)) {
        return true;
      }
    }

    if (selectedExercises.length !== initialExercises.length) return true;
    for (let index = 0; index < selectedExercises.length; index += 1) {
      const currentExercise = selectedExercises[index];
      const initialExercise = initialExercises[index];

      if (
        !initialExercise ||
        currentExercise.exerciseId !== initialExercise.exerciseId ||
        currentExercise.exerciseOrder !== initialExercise.exerciseOrder ||
        currentExercise.setsTarget !== initialExercise.setsTarget ||
        currentExercise.repsTarget !== initialExercise.repsTarget
      ) {
        return true;
      }
    }

    return false;
  }, [description, detail, initialValues, name, selectedExercises, selectedTags]);

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
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setScreen("exercises");
  };

  const handleBack = () => {
    setScreen("basic");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      detail: detail.trim() || undefined,
      description: description.trim() || undefined,
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
    setDetail("");
    setDescription("");
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
        exerciseOrder: prev.length + 1,
        setsTarget: "1",
        repsTarget: "",
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

  const handleCreateExercise = async (payload: { name: string; muscleGroup: string }) => {
    const createdExercise = await createExercise(payload);
    handleAddExercise(createdExercise);
  };

  const handleModalClose = () => {
    setName("");
    setNameError(false);
    setDetail("");
    setDescription("");
    setSelectedTags(new Set());
    setSelectedExercises([]);
    setSearchQuery("");
    setScreen("basic");
    setCreateExerciseModalVisible(false);
    onClose();
  };

  const handleRequestClose = () => {
    if (!hasUnsavedChanges) {
      handleModalClose();
      return;
    }

    showConfirm({
      title: t("routines.discardChangesTitle"),
      message: t("routines.discardChangesMessage"),
      cancelLabel: t("routines.keepEditingButton"),
      confirmLabel: t("routines.discardChangesButton"),
      confirmVariant: "destructive",
      onConfirm: handleModalClose,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleRequestClose}
    >
      <View style={[styles.container, { backgroundColor: palette.page }]}>
        <View
          style={[
            styles.header,
            { borderBottomColor: palette.border, paddingTop: Math.max(12, insets.top + 8) },
          ]}
        >
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
            {screen === "basic"
              ? mode === "edit"
                ? t("routines.editRoutine")
                : t("routines.createRoutine")
              : t("routines.addExercises")}
          </Text>

          <View style={styles.headerRightActions}>
            <Text style={[styles.stepIndicator, { color: palette.textSecondary }]}>
              {screen === "basic" ? "1/2" : "2/2"}
            </Text>
            <WindowControlButton
              variant="close"
              size="md"
              onPress={handleRequestClose}
              accessibilityLabel={t("routines.closeActionsButton")}
              borderColor={palette.border}
              backgroundColor={palette.card}
              iconColor={palette.textPrimary}
            />
          </View>
        </View>

        {screen === "basic" ? (
          <BasicInfoScreen
            name={name}
            onChangeName={(newName) => {
              setName(newName);
              if (newName.trim()) setNameError(false);
            }}
            detail={detail}
            onChangeDetail={setDetail}
            description={description}
            onChangeDescription={setDescription}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            locale={locale}
            palette={palette}
            t={t}
            nameError={nameError}
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
            showCreateExerciseButton
            onCreateExercisePress={() => setCreateExerciseModalVisible(true)}
            palette={palette}
            t={t}
          />
        )}

        <View
          style={[
            styles.footer,
            { borderTopColor: palette.border, paddingBottom: Math.max(16, insets.bottom + 8) },
          ]}
        >
          {screen === "basic" && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: palette.border }]}
                onPress={handleRequestClose}
              >
                <Text style={[styles.buttonText, { color: palette.textPrimary }]}>
                  {t("routines.cancelButton")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={handleNext}
              >
                <Text style={[styles.buttonText, { color: palette.onAccent }]}>
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
                onPress={() => {
                  void handleCreate();
                }}
              >
                <Text style={[styles.buttonText, { color: palette.onAccent }]}>
                  {mode === "edit" ? t("routines.saveButton") : t("routines.createButton")} ✓
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <CreateExerciseModal
          visible={createExerciseModalVisible}
          onClose={() => setCreateExerciseModalVisible(false)}
          muscleGroups={muscleGroups}
          onSubmit={handleCreateExercise}
        />

        {alertElement}
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
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
