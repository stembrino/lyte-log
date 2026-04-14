import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import {
  getActiveWorkout,
  type ActiveWorkoutRow,
} from "@/features/workouts/dao/queries/workoutQueries";
import {
  addWorkoutSet,
  cancelWorkout,
  finishWorkout,
  updateWorkoutSet,
  updateWorkoutSetCompleted,
} from "@/features/workouts/dao/mutations/workoutMutations";
import { RoundAddButton } from "@/components/RoundAddButton";
import { WorkoutStatusDot } from "@/features/workouts/components/WorkoutStatusDot";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export function InProgressWorkoutScreen() {
  const router = useRouter();
  const palette = useRetroPalette();
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<ActiveWorkoutRow | null>(null);
  const [repsDraftBySetId, setRepsDraftBySetId] = useState<Record<string, string>>({});
  const [weightDraftBySetId, setWeightDraftBySetId] = useState<Record<string, string>>({});
  const [canceling, setCanceling] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const syncWorkout = async () => {
        setLoading(true);

        try {
          const current = await getActiveWorkout();

          if (!active) {
            return;
          }

          setWorkout(current);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      void syncWorkout();

      return () => {
        active = false;
      };
    }, []),
  );

  const formatWeight = (value: number) => {
    if (Number.isInteger(value)) {
      return String(value);
    }

    return value.toFixed(1);
  };

  const handleMinimizeWorkout = () => {
    router.replace({
      pathname: "/(tabs)/workouts",
      params: {
        skipActiveRedirect: "1",
      },
    });
  };

  const handlePersistSet = async (args: {
    setId: string;
    currentReps: number;
    currentWeight: number;
  }) => {
    const nextRepsDraft = repsDraftBySetId[args.setId];
    const nextWeightDraft = weightDraftBySetId[args.setId];

    const parsedReps = Number.parseInt(nextRepsDraft ?? String(args.currentReps), 10);
    const sanitizedReps = Number.isFinite(parsedReps) && parsedReps > 0 ? parsedReps : 0;

    const normalizedWeightInput = (nextWeightDraft ?? String(args.currentWeight)).replace(",", ".");
    const parsedWeight = Number.parseFloat(normalizedWeightInput);
    const sanitizedWeight = Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 0;

    try {
      await updateWorkoutSet({
        setId: args.setId,
        reps: sanitizedReps,
        weight: sanitizedWeight,
      });

      setWorkout((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === args.setId
                ? {
                    ...set,
                    reps: sanitizedReps,
                    weight: sanitizedWeight,
                  }
                : set,
            ),
          })),
        };
      });

      setRepsDraftBySetId((prev) => ({
        ...prev,
        [args.setId]: String(sanitizedReps),
      }));
      setWeightDraftBySetId((prev) => ({
        ...prev,
        [args.setId]: sanitizedWeight > 0 ? formatWeight(sanitizedWeight) : "",
      }));
    } catch {
      Alert.alert(t("workouts.updateSetErrorTitle"), t("workouts.updateSetErrorBody"));
    }
  };

  const handleToggleSetCompleted = async (args: { setId: string; completed: boolean }) => {
    try {
      await updateWorkoutSetCompleted({
        setId: args.setId,
        completed: !args.completed,
      });

      setWorkout((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          exercises: prev.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === args.setId
                ? {
                    ...set,
                    completed: !args.completed,
                  }
                : set,
            ),
          })),
        };
      });
    } catch {
      Alert.alert(t("workouts.updateSetErrorTitle"), t("workouts.updateSetErrorBody"));
    }
  };

  const handleAddSet = async (workoutExerciseId: string) => {
    try {
      const createdSet = await addWorkoutSet({
        workoutExerciseId,
        reps: 0,
        weight: 0,
      });

      setWorkout((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          exercises: prev.exercises.map((exercise) =>
            exercise.id === workoutExerciseId
              ? {
                  ...exercise,
                  sets: [...exercise.sets, createdSet],
                }
              : exercise,
          ),
        };
      });

      setRepsDraftBySetId((prev) => ({
        ...prev,
        [createdSet.id]: "",
      }));
      setWeightDraftBySetId((prev) => ({
        ...prev,
        [createdSet.id]: "",
      }));
    } catch {
      Alert.alert(t("workouts.addSetErrorTitle"), t("workouts.addSetErrorBody"));
    }
  };

  const handleCancelWorkoutPress = () => {
    if (!workout || canceling) {
      return;
    }

    Alert.alert(t("workouts.cancelWorkoutTitle"), t("workouts.cancelWorkoutBody"), [
      {
        text: t("exercises.cancel"),
        style: "cancel",
      },
      {
        text: t("workouts.cancelWorkoutConfirmCta"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            setCanceling(true);

            try {
              await cancelWorkout(workout.id);
              handleMinimizeWorkout();
            } finally {
              setCanceling(false);
            }
          })();
        },
      },
    ]);
  };

  const handleFinishWorkoutPress = () => {
    if (!workout || finishing) {
      return;
    }

    Alert.alert(t("workouts.finishWorkoutTitle"), t("workouts.finishWorkoutBody"), [
      {
        text: t("exercises.cancel"),
        style: "cancel",
      },
      {
        text: t("workouts.finishWorkoutConfirmCta"),
        onPress: () => {
          void (async () => {
            setFinishing(true);

            try {
              await finishWorkout(workout.id);
              handleMinimizeWorkout();
            } finally {
              setFinishing(false);
            }
          })();
        },
      },
    ]);
  };

  const completedSetColor = colorScheme === "light" ? "#16A34A" : palette.success;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.page,
          paddingTop: Math.max(16, insets.top + 8),
          paddingBottom: Math.max(12, insets.bottom + 8),
        },
      ]}
    >
      <View style={styles.stickyHeaderWrap}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <WorkoutStatusDot status={workout?.status} />
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              {t("workouts.inProgressTitle")}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.minimizeInlineButton, { borderColor: palette.border }]}
            onPress={handleMinimizeWorkout}
          >
            <Text style={[styles.minimizeInlineText, { color: palette.textPrimary }]}>
              {t("workouts.minimizeWorkoutCta")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        {workout?.gym ? (
          <Text style={[styles.gymText, { color: palette.accent }]}>
            {t("workouts.gymFieldLabel")}: {workout.gym.name}
          </Text>
        ) : null}

        {loading ? (
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {t("routines.loading")}
          </Text>
        ) : null}

        {!loading && !workout ? (
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {t("workouts.inProgressNoActive")}
          </Text>
        ) : null}

        {workout
          ? workout.exercises.map((exercise) => (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  { borderColor: palette.border, backgroundColor: palette.card },
                ]}
              >
                <View style={styles.exerciseHeaderRow}>
                  <Text style={[styles.exerciseOrder, { color: palette.accent }]}>
                    {exercise.exerciseOrder}.
                  </Text>
                  <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>
                    {exercise.exercise.name}
                  </Text>
                </View>

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
                              backgroundColor: set.completed
                                ? `${completedSetColor}14`
                                : palette.card,
                            },
                          ]}
                        >
                          <Text style={[styles.setIndex, { color: palette.textPrimary }]}>
                            {index + 1}
                          </Text>
                          <View style={styles.compactFieldGroup}>
                            <View style={styles.inputWithSuffix}>
                              <TextInput
                                style={[
                                  styles.compactInput,
                                  styles.compactInputWithSuffix,
                                  {
                                    borderColor: palette.border,
                                    color: palette.textPrimary,
                                    backgroundColor: palette.page,
                                  },
                                ]}
                                value={repsDraftBySetId[set.id] ?? String(set.reps)}
                                onChangeText={(value) => {
                                  setRepsDraftBySetId((prev) => ({
                                    ...prev,
                                    [set.id]: value,
                                  }));
                                }}
                                onEndEditing={() => {
                                  void handlePersistSet({
                                    setId: set.id,
                                    currentReps: set.reps,
                                    currentWeight: set.weight,
                                  });
                                }}
                                placeholder={t("workouts.repsInputPlaceholder")}
                                placeholderTextColor={palette.textSecondary}
                                keyboardType="number-pad"
                              />
                              <Text
                                style={[styles.inputInlineSuffix, { color: palette.textSecondary }]}
                              >
                                {t("workouts.repsUnitSuffix")}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.compactFieldGroup}>
                            <View style={styles.inputWithSuffix}>
                              <TextInput
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
                                onEndEditing={() => {
                                  void handlePersistSet({
                                    setId: set.id,
                                    currentReps: set.reps,
                                    currentWeight: set.weight,
                                  });
                                }}
                                placeholder={t("workouts.weightInputPlaceholder")}
                                placeholderTextColor={palette.textSecondary}
                                keyboardType="decimal-pad"
                              />
                              <Text
                                style={[styles.inputInlineSuffix, { color: palette.textSecondary }]}
                              >
                                {t("workouts.weightUnit")}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.completeSetButton,
                              {
                                backgroundColor: set.completed
                                  ? `${completedSetColor}1F`
                                  : "transparent",
                              },
                            ]}
                            onPress={() => {
                              void handleToggleSetCompleted({
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
                      void handleAddSet(exercise.id);
                    }}
                  />
                </View>
              </View>
            ))
          : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: palette.accent, borderColor: palette.accent },
            ]}
            onPress={handleFinishWorkoutPress}
          >
            <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>
              {finishing ? t("routines.loading") : t("workouts.finishWorkoutCta")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: palette.border }]}
            onPress={handleCancelWorkoutPress}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
              {canceling ? t("routines.loading") : t("workouts.cancelWorkoutCta")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    paddingBottom: 24,
    gap: 10,
  },
  stickyHeaderWrap: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingLeft: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  minimizeInlineButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  minimizeInlineText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  gymText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  meta: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
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
  actionsRow: {
    marginTop: 6,
    gap: 8,
  },
  primaryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  secondaryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
