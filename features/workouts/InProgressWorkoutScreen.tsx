import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";
import { useI18n } from "@/components/providers/i18n-provider";
import { AvatarWithPreview } from "@/components/AvatarWithPreview";
import { monoFont } from "@/constants/retroTheme";
import { resolveExerciseImageSource } from "@/features/exercises/utils/exerciseImageSource";
import {
  getActiveWorkout,
  type ActiveWorkoutRow,
} from "@/features/workouts/dao/queries/workoutQueries";
import {
  addWorkoutExerciseWithInitialSet,
  addWorkoutSet,
  cancelWorkout,
  finishWorkout,
  removeWorkoutExercise,
  removeWorkoutSet,
  saveWorkoutAsRoutine,
  updateWorkoutSet,
  updateWorkoutSetCompleted,
} from "@/features/workouts/dao/mutations/workoutMutations";
import { RoundAddButton } from "@/components/RoundAddButton";
import { WorkoutStatusDot } from "@/features/workouts/components/WorkoutStatusDot";
import { PrepareWorkoutExercisePickerModal } from "@/features/workouts/components/prepare/PrepareWorkoutExercisePickerModal";
import { PostFinishQuickActionsSheet } from "./components/PostFinishQuickActionsSheet";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Keyboard,
  Share,
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
import type { ExerciseLibraryItem } from "@/features/exercises/hooks/usePaginatedExerciseLibrary";

export function InProgressWorkoutScreen() {
  const router = useRouter();
  const palette = useRetroPalette();
  const colorScheme = useColorScheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<ActiveWorkoutRow | null>(null);
  const [repsDraftBySetId, setRepsDraftBySetId] = useState<Record<string, string>>({});
  const [weightDraftBySetId, setWeightDraftBySetId] = useState<Record<string, string>>({});
  const [canceling, setCanceling] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
  const [isPostFinishPanelOpen, setIsPostFinishPanelOpen] = useState(false);
  const [savingAsRoutine, setSavingAsRoutine] = useState(false);
  const { showAlert, showConfirm, alertElement } = useGlobalAlert();

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

  const extractSourceRoutineId = (notes: string | null | undefined): string | null => {
    if (!notes) {
      return null;
    }

    try {
      const parsed = JSON.parse(notes) as { sourceRoutineId?: string | null };
      return parsed.sourceRoutineId ?? null;
    } catch {
      return null;
    }
  };

  const buildWorkoutShareText = (activeWorkout: ActiveWorkoutRow) => {
    const dateText = new Date(activeWorkout.createdAt).toLocaleDateString(locale);
    const header = [`${t("workouts.inProgressTitle")} - ${dateText}`];

    if (activeWorkout.gym?.name) {
      header.push(`${t("workouts.gymFieldLabel")}: ${activeWorkout.gym.name}`);
    }

    const lines = activeWorkout.exercises.flatMap((exercise, exerciseIndex) => {
      const exerciseTitle = `${exerciseIndex + 1}. ${exercise.exercise.name}`;

      if (exercise.sets.length === 0) {
        return [exerciseTitle, `  - ${t("workouts.inProgressNoSets")}`];
      }

      const setLines = exercise.sets.map((set, setIndex) => {
        const repsText = set.reps > 0 ? String(set.reps) : "-";
        const weightText = set.weight > 0 ? formatWeight(set.weight) : "-";
        return `  - ${t("workouts.setLabel")} ${setIndex + 1}: ${repsText} ${t("workouts.repsUnitSuffix")} x ${weightText} ${t("workouts.weightUnit")}`;
      });

      return [exerciseTitle, ...setLines];
    });

    return [...header, "", ...lines].join("\n");
  };

  const handleClosePostFinishPanel = () => {
    setIsPostFinishPanelOpen(false);
    handleMinimizeWorkout();
  };

  const buildDefaultRoutineName = () => {
    if (!workout) return "";
    const createdAtLabel = new Date(workout.createdAt).toLocaleDateString(locale);
    return `${t("workouts.postFinishDefaultRoutineNamePrefix")} ${createdAtLabel}`;
  };

  const handleSaveAsRoutine = async (routineName: string) => {
    if (!workout || savingAsRoutine) {
      return;
    }

    setSavingAsRoutine(true);

    try {
      await saveWorkoutAsRoutine({
        locale,
        routineName: routineName,
        exercises: workout.exercises.map((exercise) => ({
          exerciseId: exercise.exercise.id,
          exerciseOrder: exercise.exerciseOrder,
          sets: exercise.sets.map((set) => ({ reps: set.reps })),
        })),
      });

      showAlert({
        title: t("workouts.saveAsRoutineSuccessTitle"),
        message: t("workouts.saveAsRoutineSuccessBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
    } catch {
      showAlert({
        title: t("workouts.saveAsRoutineErrorTitle"),
        message: t("workouts.saveAsRoutineErrorBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
    } finally {
      setSavingAsRoutine(false);
    }
  };

  const handleCopyWorkoutAsText = async () => {
    if (!workout) {
      return;
    }

    try {
      const message = buildWorkoutShareText(workout);
      await Share.share({ message });
    } catch {
      showAlert({
        title: t("workouts.copyWorkoutTextErrorTitle"),
        message: t("workouts.copyWorkoutTextErrorBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
    }
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
      showAlert({
        title: t("workouts.updateSetErrorTitle"),
        message: t("workouts.updateSetErrorBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
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
      showAlert({
        title: t("workouts.updateSetErrorTitle"),
        message: t("workouts.updateSetErrorBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
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
      showAlert({
        title: t("workouts.addSetErrorTitle"),
        message: t("workouts.addSetErrorBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
    }
  };

  const handleAddExercise = async (exercise: ExerciseLibraryItem) => {
    if (!workout) {
      return;
    }

    try {
      const created = await addWorkoutExerciseWithInitialSet({
        workoutId: workout.id,
        exerciseId: exercise.id,
      });

      setWorkout((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          exercises: [
            ...prev.exercises,
            {
              id: created.exercise.id,
              exerciseOrder: created.exercise.exerciseOrder,
              exercise: {
                id: exercise.id,
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
              },
              sets: [created.initialSet],
            },
          ],
        };
      });

      setRepsDraftBySetId((prev) => ({
        ...prev,
        [created.initialSet.id]: "",
      }));
      setWeightDraftBySetId((prev) => ({
        ...prev,
        [created.initialSet.id]: "",
      }));
    } catch {
      showAlert({
        title: t("workouts.addSetErrorTitle"),
        message: t("workouts.addSetErrorBody"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
    }
  };

  const handleDeleteExercisePress = (exerciseId: string, exerciseName: string) => {
    if (!workout || deletingExerciseId) {
      return;
    }

    showConfirm({
      title: t("workouts.removeExerciseTitle"),
      message: t("workouts.removeExerciseBody", { name: exerciseName }),
      cancelLabel: t("exercises.cancel"),
      confirmLabel: t("workouts.removeExerciseConfirmCta"),
      confirmVariant: "destructive",
      onConfirm: () => {
        void (async () => {
          setDeletingExerciseId(exerciseId);

          try {
            await removeWorkoutExercise({
              workoutId: workout.id,
              workoutExerciseId: exerciseId,
            });

            setWorkout((prev) => {
              if (!prev) {
                return prev;
              }

              const remainingExercises = prev.exercises
                .filter((exercise) => exercise.id !== exerciseId)
                .map((exercise, index) => ({ ...exercise, exerciseOrder: index + 1 }));

              return {
                ...prev,
                exercises: remainingExercises,
              };
            });

            setRepsDraftBySetId((prev) => {
              const next = { ...prev };
              const removedSetIds =
                workout.exercises.find((exercise) => exercise.id === exerciseId)?.sets ?? [];
              removedSetIds.forEach((set) => {
                delete next[set.id];
              });
              return next;
            });

            setWeightDraftBySetId((prev) => {
              const next = { ...prev };
              const removedSetIds =
                workout.exercises.find((exercise) => exercise.id === exerciseId)?.sets ?? [];
              removedSetIds.forEach((set) => {
                delete next[set.id];
              });
              return next;
            });
          } catch {
            showAlert({
              title: t("workouts.removeExerciseErrorTitle"),
              message: t("workouts.removeExerciseErrorBody"),
              buttonLabel: t("workouts.postFinishCloseCta"),
            });
          } finally {
            setDeletingExerciseId(null);
          }
        })();
      },
    });
  };

  const handleDeleteSetPress = (args: {
    setId: string;
    workoutExerciseId: string;
    setIndex: number;
  }) => {
    if (deletingSetId) {
      return;
    }

    showConfirm({
      title: t("workouts.removeSetTitle"),
      message: t("workouts.removeSetBody"),
      cancelLabel: t("exercises.cancel"),
      confirmLabel: t("workouts.removeSetConfirmCta"),
      confirmVariant: "destructive",
      onConfirm: () => {
        void (async () => {
          setDeletingSetId(args.setId);

          try {
            await removeWorkoutSet({
              setId: args.setId,
            });

            setWorkout((prev) => {
              if (!prev) {
                return prev;
              }

              return {
                ...prev,
                exercises: prev.exercises.map((exercise) =>
                  exercise.id === args.workoutExerciseId
                    ? {
                        ...exercise,
                        sets: exercise.sets.filter((set) => set.id !== args.setId),
                      }
                    : exercise,
                ),
              };
            });

            setRepsDraftBySetId((prev) => {
              const next = { ...prev };
              delete next[args.setId];
              return next;
            });

            setWeightDraftBySetId((prev) => {
              const next = { ...prev };
              delete next[args.setId];
              return next;
            });
          } catch {
            showAlert({
              title: t("workouts.removeSetErrorTitle"),
              message: t("workouts.removeSetErrorBody"),
              buttonLabel: t("workouts.postFinishCloseCta"),
            });
          } finally {
            setDeletingSetId(null);
          }
        })();
      },
    });
  };

  const handleCancelWorkoutPress = () => {
    if (!workout || canceling) {
      return;
    }

    showConfirm({
      title: t("workouts.cancelWorkoutTitle"),
      message: t("workouts.cancelWorkoutBody"),
      cancelLabel: t("exercises.cancel"),
      confirmLabel: t("workouts.cancelWorkoutConfirmCta"),
      confirmVariant: "destructive",
      onConfirm: () => {
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
    });
  };

  const handleFinishWorkoutPress = () => {
    if (!workout || finishing || workout.exercises.length === 0) {
      return;
    }

    showConfirm({
      title: t("workouts.finishWorkoutTitle"),
      message: t("workouts.finishWorkoutBody"),
      cancelLabel: t("exercises.cancel"),
      confirmLabel: t("workouts.finishWorkoutConfirmCta"),
      onConfirm: () => {
        void (async () => {
          if (workout.exercises.length === 0) {
            return;
          }

          setFinishing(true);

          try {
            await finishWorkout(workout.id);
            Keyboard.dismiss();
            setIsPostFinishPanelOpen(true);
          } finally {
            setFinishing(false);
          }
        })();
      },
    });
  };

  const completedSetColor = colorScheme === "light" ? "#16A34A" : palette.success;
  const shouldSuggestSaveAsRoutine =
    Boolean(workout) && extractSourceRoutineId(workout?.notes) === null;
  const canFinishWorkout = Boolean(workout) && (workout?.exercises.length ?? 0) > 0;

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
                    style={styles.removeExerciseButton}
                    onPress={() => handleDeleteExercisePress(exercise.id, exercise.exercise.name)}
                    disabled={deletingExerciseId === exercise.id}
                    accessibilityRole="button"
                    accessibilityLabel={t("workouts.removeExerciseConfirmCta")}
                  >
                    <FontAwesome name="trash-o" size={18} color={palette.textSecondary} />
                  </TouchableOpacity>
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
                                value={
                                  repsDraftBySetId[set.id] ?? (set.reps > 0 ? String(set.reps) : "")
                                }
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
                            style={styles.removeSetButton}
                            onPress={() => {
                              handleDeleteSetPress({
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

        {workout ? (
          <View style={[styles.exerciseActionsGroup, { borderBottomColor: palette.border }]}>
            <TouchableOpacity
              style={[styles.addExerciseButton, { borderColor: palette.border }]}
              onPress={() => setIsExercisePickerOpen(true)}
            >
              <Text style={[styles.addExerciseButtonText, { color: palette.textPrimary }]}>
                + {t("routines.addExerciseButton")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              canFinishWorkout
                ? { backgroundColor: palette.accent, borderColor: palette.accent }
                : {
                    backgroundColor: palette.page,
                    borderColor: palette.border,
                    opacity: 0.5,
                  },
            ]}
            onPress={handleFinishWorkoutPress}
            disabled={!canFinishWorkout || finishing}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: canFinishWorkout ? palette.onAccent : palette.textSecondary },
              ]}
            >
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

      <PrepareWorkoutExercisePickerModal
        isOpen={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        locale={locale}
        excludeExerciseIds={workout?.exercises.map((exercise) => exercise.exercise.id) ?? []}
        onAddExercise={(exercise) => {
          void handleAddExercise(exercise);
        }}
        title={t("workouts.addExercisePickerTitle")}
        hint={t("workouts.addExercisePickerHint")}
        searchPlaceholder={t("routines.searchExercisePlaceholder")}
        addButtonLabel={t("routines.addExerciseButton")}
        emptyLabel={t("routines.noExerciseResults")}
        loadingLabel={t("routines.loading")}
      />

      <PostFinishQuickActionsSheet
        isOpen={isPostFinishPanelOpen}
        savingAsRoutine={savingAsRoutine}
        showSaveAsRoutine={shouldSuggestSaveAsRoutine}
        defaultRoutineName={buildDefaultRoutineName()}
        onClose={handleClosePostFinishPanel}
        onSaveAsRoutine={(name) => {
          void handleSaveAsRoutine(name);
        }}
        onCopyWorkoutAsText={() => {
          void handleCopyWorkoutAsText();
        }}
      />

      {alertElement}
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
  exerciseActionsGroup: {
    marginTop: 8,
    marginBottom: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  addExerciseButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  addExerciseButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
  removeExerciseButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
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
  removeSetButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
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
