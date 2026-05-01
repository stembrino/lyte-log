import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import { useCallback, useRef } from "react";
import { getCompletedWorkoutsCount } from "@/features/workouts/dao/queries/workoutQueries";

const RATING_PROMPT_MIN_COMPLETED_WORKOUTS = 5;
const RATING_PROMPT_VERSION_KEY = "rating_prompt:last_version";

function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "dev";
}

export function useWorkoutRatingPrompt() {
  const promptingRef = useRef(false);

  const maybePromptForCompletedWorkout = useCallback(async () => {
    if (promptingRef.current) {
      return false;
    }

    promptingRef.current = true;

    try {
      const isReviewAvailable = await StoreReview.isAvailableAsync();
      if (!isReviewAvailable) {
        return false;
      }

      const completedWorkoutsCount = await getCompletedWorkoutsCount();
      if (completedWorkoutsCount < RATING_PROMPT_MIN_COMPLETED_WORKOUTS) {
        return false;
      }

      const currentVersion = getCurrentAppVersion();
      const lastPromptedVersion = await AsyncStorage.getItem(RATING_PROMPT_VERSION_KEY);

      if (lastPromptedVersion === currentVersion) {
        return false;
      }

      await StoreReview.requestReview();
      await AsyncStorage.setItem(RATING_PROMPT_VERSION_KEY, currentVersion);
      return true;
    } catch {
      return false;
    } finally {
      promptingRef.current = false;
    }
  }, []);

  return {
    maybePromptForCompletedWorkout,
  };
}
