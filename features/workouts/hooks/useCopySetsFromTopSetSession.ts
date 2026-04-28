import { useCallback, useState } from "react";
import type { ActiveWorkoutRow } from "@/features/workouts/dao/queries/workoutQueries";
import { getActiveWorkout } from "@/features/workouts/dao/queries/workoutQueries";
import {
  addWorkoutSet,
  removeWorkoutSet,
} from "@/features/workouts/dao/mutations/workoutMutations";
import { getCompletedExerciseSnapshotByWorkoutId } from "@/features/workouts/dao/queries/workoutSetQueries";
import type { ExerciseTopSetState } from "@/features/workouts/hooks/useExerciseTopSet";
import { useI18n } from "@/components/providers/i18n-provider";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";

type UseCopySetsFromTopSetSessionParams = {
  workout: ActiveWorkoutRow | null;
  onWorkoutUpdated: (workout: ActiveWorkoutRow) => void;
};

export function useCopySetsFromTopSetSession({
  workout,
  onWorkoutUpdated,
}: UseCopySetsFromTopSetSessionParams) {
  const { locale, t } = useI18n();
  const { showAlert } = useGlobalAlert();
  const [copyingTopSetSessionForExerciseId, setCopyingTopSetSessionForExerciseId] = useState<
    string | null
  >(null);

  const handleCopySetsFromTopSetSession = useCallback(
    async (workoutExerciseId: string, exerciseId: string, topSetState: ExerciseTopSetState) => {
      if (copyingTopSetSessionForExerciseId || !workout) {
        return;
      }

      if (topSetState.status !== "loaded") {
        showAlert({
          title: t("workouts.historyPanelApplyTopSetSessionErrorTitle"),
          message: t("workouts.historyPanelApplyTopSetSessionErrorBody"),
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
        return;
      }

      const sourceWorkoutId = topSetState.snapshot.topSet.workoutId;
      setCopyingTopSetSessionForExerciseId(workoutExerciseId);

      try {
        const snapshot =
          topSetState.snapshot.session ??
          (await getCompletedExerciseSnapshotByWorkoutId({
            exerciseId,
            workoutId: sourceWorkoutId,
          }));

        if (!snapshot || snapshot.sets.length === 0) {
          showAlert({
            title: t("workouts.historyPanelApplyTopSetSessionErrorTitle"),
            message: t("workouts.historyPanelApplyTopSetSessionErrorBody"),
            buttonLabel: t("workouts.postFinishCloseCta"),
          });
          return;
        }

        const exercise = workout.exercises.find((e) => e.id === workoutExerciseId);
        if (!exercise) {
          return;
        }

        for (const set of exercise.sets) {
          try {
            await removeWorkoutSet({ setId: set.id });
          } catch {
            // Keep going to avoid leaving partially copied state.
          }
        }

        for (const snapshotSet of snapshot.sets) {
          try {
            await addWorkoutSet({
              workoutExerciseId,
              reps: snapshotSet.reps,
              weight: snapshotSet.weight,
            });
          } catch {
            // Keep going and then reload the workout state.
          }
        }

        const updated = await getActiveWorkout(locale);
        if (updated) {
          onWorkoutUpdated(updated);
        }

        showAlert({
          title: t("workouts.historyPanelApplyTopSetSessionSuccessTitle"),
          message: t("workouts.historyPanelApplyTopSetSessionSuccessBody"),
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      } catch {
        showAlert({
          title: t("workouts.historyPanelApplyTopSetSessionErrorTitle"),
          message: t("workouts.historyPanelApplyTopSetSessionErrorBody"),
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      } finally {
        setCopyingTopSetSessionForExerciseId(null);
      }
    },
    [copyingTopSetSessionForExerciseId, workout, showAlert, t, locale, onWorkoutUpdated],
  );

  return {
    handleCopySetsFromTopSetSession,
    copyingTopSetSessionForExerciseId,
  };
}
