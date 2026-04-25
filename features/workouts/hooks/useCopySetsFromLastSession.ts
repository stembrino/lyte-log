import { useCallback, useState } from "react";
import type { ActiveWorkoutRow } from "@/features/workouts/dao/queries/workoutQueries";
import { getActiveWorkout } from "@/features/workouts/dao/queries/workoutQueries";
import {
  addWorkoutSet,
  removeWorkoutSet,
} from "@/features/workouts/dao/mutations/workoutMutations";
import type { ExerciseLastSessionState } from "@/features/workouts/hooks/useExerciseLastSession";
import { useI18n } from "@/components/providers/i18n-provider";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";

type UseCopySetsFromLastSessionParams = {
  workout: ActiveWorkoutRow | null;
  getHistoryState: (exerciseId: string) => ExerciseLastSessionState;
  onWorkoutUpdated: (workout: ActiveWorkoutRow) => void;
};

function formatWeight(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

export function useCopySetsFromLastSession({
  workout,
  getHistoryState,
  onWorkoutUpdated,
}: UseCopySetsFromLastSessionParams) {
  const { locale, t } = useI18n();
  const { showAlert } = useGlobalAlert();
  const [copyingSetsForExerciseId, setCopyingSetsForExerciseId] = useState<string | null>(null);

  const handleCopySetsFromLastSession = useCallback(
    async (workoutExerciseId: string, exerciseId: string) => {
      if (copyingSetsForExerciseId || !workout) {
        return;
      }

      setCopyingSetsForExerciseId(workoutExerciseId);

      try {
        const historyState = getHistoryState(exerciseId);

        if (historyState.status !== "loaded" || !historyState.snapshot) {
          showAlert({
            title: t("workouts.copySetsErrorTitle") || "Copy error",
            message: t("workouts.copySetsErrorBody") || "Could not copy sets from last session.",
            buttonLabel: t("workouts.postFinishCloseCta"),
          });
          return;
        }

        const exercise = workout.exercises.find((e) => e.id === workoutExerciseId);
        if (!exercise) {
          return;
        }

        const { snapshot } = historyState;

        // Remove all existing sets first
        for (const set of exercise.sets) {
          try {
            await removeWorkoutSet({ setId: set.id });
          } catch {
            // Continue removing other sets even if one fails
          }
        }

        // Add new sets from snapshot
        const repsDraft: Record<string, string> = {};
        const weightDraft: Record<string, string> = {};

        for (const snapshotSet of snapshot.sets) {
          try {
            const createdSet = await addWorkoutSet({
              workoutExerciseId,
              reps: snapshotSet.reps,
              weight: snapshotSet.weight,
            });

            repsDraft[createdSet.id] = String(snapshotSet.reps);
            weightDraft[createdSet.id] = formatWeight(snapshotSet.weight);
          } catch {
            // Continue adding other sets even if one fails
          }
        }

        // Reload workout to reflect changes
        const updated = await getActiveWorkout(locale);
        if (updated) {
          onWorkoutUpdated(updated);
        }

        showAlert({
          title: t("workouts.copySetsSuccessTitle") || "Sets copied",
          message:
            t("workouts.copySetsSuccessBody") ||
            "Sets from last session have been added to this exercise.",
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      } catch {
        showAlert({
          title: t("workouts.copySetsErrorTitle") || "Copy error",
          message: t("workouts.copySetsErrorBody") || "Could not copy sets from last session.",
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      } finally {
        setCopyingSetsForExerciseId(null);
      }
    },
    [copyingSetsForExerciseId, workout, getHistoryState, showAlert, t, locale, onWorkoutUpdated],
  );

  return {
    handleCopySetsFromLastSession,
    copyingSetsForExerciseId,
  };
}
