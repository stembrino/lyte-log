import {
  getLastCompletedExerciseSnapshot,
  type LastCompletedExerciseSnapshot,
} from "@/features/workouts/dao/queries/workoutSetQueries";
import { useCallback, useState } from "react";

type ExerciseLastSessionState =
  | {
      status: "idle";
      snapshot: null;
    }
  | {
      status: "loading";
      snapshot: null;
    }
  | {
      status: "loaded";
      snapshot: LastCompletedExerciseSnapshot;
    }
  | {
      status: "empty";
      snapshot: null;
    }
  | {
      status: "error";
      snapshot: null;
    };

const IDLE_STATE: ExerciseLastSessionState = {
  status: "idle",
  snapshot: null,
};

export function useExerciseLastSession(activeWorkoutId: string | null, activeGymId: string | null) {
  const [stateByExerciseId, setStateByExerciseId] = useState<
    Record<string, ExerciseLastSessionState>
  >({});

  const ensureLoaded = useCallback(
    async (exerciseId: string) => {
      const currentState = stateByExerciseId[exerciseId];

      if (
        currentState?.status === "loading" ||
        currentState?.status === "loaded" ||
        currentState?.status === "empty"
      ) {
        return;
      }

      setStateByExerciseId((prev) => ({
        ...prev,
        [exerciseId]: {
          status: "loading",
          snapshot: null,
        },
      }));

      try {
        const snapshot = await getLastCompletedExerciseSnapshot({
          exerciseId,
          excludeWorkoutId: activeWorkoutId ?? undefined,
          gymId: activeGymId,
        });

        setStateByExerciseId((prev) => ({
          ...prev,
          [exerciseId]: snapshot
            ? {
                status: "loaded",
                snapshot,
              }
            : {
                status: "empty",
                snapshot: null,
              },
        }));
      } catch {
        setStateByExerciseId((prev) => ({
          ...prev,
          [exerciseId]: {
            status: "error",
            snapshot: null,
          },
        }));
      }
    },
    [activeGymId, activeWorkoutId, stateByExerciseId],
  );

  const retry = useCallback(
    async (exerciseId: string) => {
      setStateByExerciseId((prev) => ({
        ...prev,
        [exerciseId]: IDLE_STATE,
      }));

      await ensureLoaded(exerciseId);
    },
    [ensureLoaded],
  );

  const getState = useCallback(
    (exerciseId: string): ExerciseLastSessionState => {
      return stateByExerciseId[exerciseId] ?? IDLE_STATE;
    },
    [stateByExerciseId],
  );

  const resetAll = useCallback(() => {
    setStateByExerciseId({});
  }, []);

  return {
    getState,
    ensureLoaded,
    retry,
    resetAll,
  };
}

export type { ExerciseLastSessionState };
