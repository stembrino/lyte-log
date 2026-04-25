import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AvatarWithPreview } from "@/components/AvatarWithPreview";
import { RoundAddButton } from "@/components/RoundAddButton";
import { monoFont } from "@/constants/retroTheme";
import { resolveExerciseImageSource } from "@/features/exercises/utils/exerciseImageSource";
import { InProgressExerciseHistoryPanel } from "@/features/workouts/components/in-progress/InProgressExerciseHistoryPanel";
import type { ExerciseLastSessionState } from "@/features/workouts/hooks/useExerciseLastSession";
import type { ActiveWorkoutRow } from "@/features/workouts/dao/queries/workoutQueries";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type WorkoutExerciseItem = ActiveWorkoutRow["exercises"][number];

type Palette = {
  page: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
};

type InProgressExerciseCardProps = {
  exercise: WorkoutExerciseItem;
  palette: Palette;
  completedSetColor: string;
  t: (key: string, vars?: Record<string, unknown>) => string;
  deletingExerciseId: string | null;
  deletingSetId: string | null;
  repsDraftBySetId: Record<string, string>;
  weightDraftBySetId: Record<string, string>;
  formatWeight: (value: number) => string;
  setInputRef: (key: string, ref: TextInput | null) => void;
  handleInputFocus: (key: string) => void;
  onDeleteExercisePress: (exerciseId: string, exerciseName: string) => void;
  isHistoryPanelOpen: boolean;
  onToggleHistoryPanel: () => void;
  historyState: ExerciseLastSessionState;
  onRetryHistory: () => void;
  onCopySets?: () => Promise<void>;
  copyingSetS?: boolean;
  onPersistSet: (args: {
    setId: string;
    currentReps: number;
    currentWeight: number;
  }) => Promise<void>;
  onDeleteSetPress: (args: { setId: string; workoutExerciseId: string; setIndex: number }) => void;
  onToggleSetCompleted: (args: { setId: string; completed: boolean }) => Promise<void>;
  onAddSet: (workoutExerciseId: string) => Promise<void>;
  setRepsDraftBySetId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setWeightDraftBySetId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export function InProgressExerciseCard({
  exercise,
  palette,
  completedSetColor,
  t,
  deletingExerciseId,
  deletingSetId,
  repsDraftBySetId,
  weightDraftBySetId,
  formatWeight,
  setInputRef,
  handleInputFocus,
  onDeleteExercisePress,
  isHistoryPanelOpen,
  onToggleHistoryPanel,
  historyState,
  onRetryHistory,
  onCopySets,
  copyingSetS,
  onPersistSet,
  onDeleteSetPress,
  onToggleSetCompleted,
  onAddSet,
  setRepsDraftBySetId,
  setWeightDraftBySetId,
}: InProgressExerciseCardProps) {
  return (
    <View
      style={[styles.exerciseCard, { borderColor: palette.border, backgroundColor: palette.card }]}
    >
      <View style={styles.exerciseHeaderRow}>
        <AvatarWithPreview
          label={exercise.exercise.name}
          size="sm"
          imageSource={resolveExerciseImageSource(exercise.exercise.id, null)}
          previewTitle={exercise.exercise.name}
        />
        <Text style={[styles.exerciseOrder, { color: palette.accent }]}>
          {exercise.exerciseOrder}.
        </Text>
        <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>
          {exercise.exercise.name}
        </Text>
        <TouchableOpacity
          style={[styles.historyToggleButton, { borderColor: palette.border }]}
          onPress={onToggleHistoryPanel}
          accessibilityRole="button"
          accessibilityLabel={t("workouts.historyToggleAccessibilityLabel")}
        >
          <Text style={[styles.historyToggleButtonText, { color: palette.textPrimary }]}>
            {isHistoryPanelOpen
              ? t("workouts.historyToggleHideCta")
              : t("workouts.historyToggleShowCta")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeExerciseButton}
          onPress={() => onDeleteExercisePress(exercise.id, exercise.exercise.name)}
          disabled={deletingExerciseId === exercise.id}
          accessibilityRole="button"
          accessibilityLabel={t("workouts.removeExerciseConfirmCta")}
        >
          <FontAwesome name="trash-o" size={18} color={palette.textSecondary} />
        </TouchableOpacity>
      </View>

      {isHistoryPanelOpen ? (
        <InProgressExerciseHistoryPanel
          palette={palette}
          t={t}
          state={historyState}
          onRetry={onRetryHistory}
          onCopySets={onCopySets}
          copyingSetS={copyingSetS}
        />
      ) : null}

      {exercise.sets.length === 0 ? (
        <Text style={[styles.noSetsText, { color: palette.textSecondary }]}>
          {t("workouts.inProgressNoSets")}
        </Text>
      ) : (
        <>
          <View style={[styles.setListDivider, { backgroundColor: palette.border }]} />
          <View style={styles.setList}>
            {exercise.sets.map((set, index) => (
              <View
                key={set.id}
                style={[
                  styles.setRow,
                  {
                    borderColor: set.completed ? completedSetColor : palette.border,
                    backgroundColor: set.completed ? `${completedSetColor}14` : palette.card,
                  },
                ]}
              >
                <Text style={[styles.setIndex, { color: palette.textPrimary }]}>{index + 1}</Text>
                <View style={styles.compactFieldGroup}>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      ref={(ref) => {
                        setInputRef(`reps-${set.id}`, ref);
                      }}
                      style={[
                        styles.compactInput,
                        styles.compactInputWithSuffix,
                        {
                          borderColor: palette.border,
                          color: palette.textPrimary,
                          backgroundColor: palette.page,
                        },
                      ]}
                      value={repsDraftBySetId[set.id] ?? (set.reps > 0 ? String(set.reps) : "")}
                      onChangeText={(value) => {
                        setRepsDraftBySetId((prev) => ({
                          ...prev,
                          [set.id]: value,
                        }));
                      }}
                      onFocus={() => {
                        handleInputFocus(`reps-${set.id}`);
                      }}
                      onEndEditing={() => {
                        void onPersistSet({
                          setId: set.id,
                          currentReps: set.reps,
                          currentWeight: set.weight,
                        });
                      }}
                      placeholder={t("workouts.repsInputPlaceholder")}
                      placeholderTextColor={palette.textSecondary}
                      keyboardType="number-pad"
                    />
                    <Text style={[styles.inputInlineSuffix, { color: palette.textSecondary }]}>
                      {t("workouts.repsUnitSuffix")}
                    </Text>
                  </View>
                </View>
                <View style={styles.compactFieldGroup}>
                  <View style={styles.inputWithSuffix}>
                    <TextInput
                      ref={(ref) => {
                        setInputRef(`weight-${set.id}`, ref);
                      }}
                      style={[
                        styles.compactInput,
                        styles.compactInputWithSuffix,
                        {
                          borderColor: palette.border,
                          color: palette.textPrimary,
                          backgroundColor: palette.page,
                        },
                      ]}
                      value={
                        weightDraftBySetId[set.id] ??
                        (set.weight > 0 ? formatWeight(set.weight) : "")
                      }
                      onChangeText={(value) => {
                        setWeightDraftBySetId((prev) => ({
                          ...prev,
                          [set.id]: value,
                        }));
                      }}
                      onFocus={() => {
                        handleInputFocus(`weight-${set.id}`);
                      }}
                      onEndEditing={() => {
                        void onPersistSet({
                          setId: set.id,
                          currentReps: set.reps,
                          currentWeight: set.weight,
                        });
                      }}
                      placeholder={t("workouts.weightInputPlaceholder")}
                      placeholderTextColor={palette.textSecondary}
                      keyboardType="decimal-pad"
                    />
                    <Text style={[styles.inputInlineSuffix, { color: palette.textSecondary }]}>
                      {t("workouts.weightUnit")}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeSetButton}
                  onPress={() => {
                    onDeleteSetPress({
                      setId: set.id,
                      workoutExerciseId: exercise.id,
                      setIndex: index,
                    });
                  }}
                  disabled={deletingSetId === set.id}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t("workouts.removeSetAccessibilityLabel")}
                >
                  <FontAwesome name="trash-o" size={16} color={palette.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completeSetButton,
                    { backgroundColor: set.completed ? `${completedSetColor}1F` : "transparent" },
                  ]}
                  onPress={() => {
                    void onToggleSetCompleted({
                      setId: set.id,
                      completed: set.completed,
                    });
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    set.completed
                      ? t("workouts.setCompletedShortLabel")
                      : t("workouts.completeSetShortLabel")
                  }
                >
                  <FontAwesome
                    name={set.completed ? "check-square" : "square-o"}
                    size={22}
                    color={set.completed ? completedSetColor : palette.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.addSetButtonRow}>
        <RoundAddButton
          size="small"
          accessibilityLabel={t("workouts.addSetAccessibilityLabel")}
          onPress={() => {
            void onAddSet(exercise.id);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  exerciseOrder: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    width: 22,
    textAlign: "right",
  },
  exerciseName: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  removeExerciseButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  historyToggleButton: {
    minHeight: 28,
    minWidth: 56,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  historyToggleButtonText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  noSetsText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  setList: {
    gap: 6,
    marginTop: 6,
  },
  setListDivider: {
    height: 1,
    marginTop: 2,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 2,
  },
  setIndex: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    width: 18,
    textAlign: "center",
  },
  compactFieldGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputWithSuffix: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  compactInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    fontFamily: monoFont,
    fontSize: 20,
    letterSpacing: 0.1,
  },
  compactInputWithSuffix: {
    paddingRight: 46,
  },
  inputInlineSuffix: {
    position: "absolute",
    right: 10,
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  removeSetButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  completeSetButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  addSetButtonRow: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
