import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/providers/i18n-provider";
import { PrimaryButton } from "@/components/PrimaryButton";
import { WorkoutStatusIndicator } from "@/components/WorkoutStatusIndicator";
import { getRetroPalette } from "@/constants/retroTheme";
import {
  getActiveWorkout,
  type ActiveWorkoutRow,
} from "@/features/workouts/dao/queries/workoutQueries";
import type { WorkoutRoutinePickerItem } from "@/features/workouts/hooks/useRoutinePicker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SelectRoutineModal } from "./components/SelectRoutineModal";

export function WorkoutsTabScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { t, locale } = useI18n();
  const palette = getRetroPalette(colorScheme);
  const [isSelectRoutineModalOpen, setIsSelectRoutineModalOpen] = useState(false);
  const [checkingActiveWorkout, setCheckingActiveWorkout] = useState(true);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const syncActiveWorkout = async () => {
        setCheckingActiveWorkout(true);

        try {
          const current = await getActiveWorkout(locale);

          if (!active) {
            return;
          }

          setActiveWorkout(current);
        } finally {
          if (active) {
            setCheckingActiveWorkout(false);
          }
        }
      };

      void syncActiveWorkout();

      return () => {
        active = false;
      };
    }, [locale]),
  );

  const handleStartWorkoutPress = () => {
    setIsSelectRoutineModalOpen(true);
  };

  const handleResumeWorkoutPress = () => {
    if (!activeWorkout) {
      return;
    }

    router.push({
      pathname: "/workout-in-progress",
      params: {
        workoutId: activeWorkout.id,
      },
    });
  };

  const handleSelectRoutine = (routine: WorkoutRoutinePickerItem) => {
    router.push({
      pathname: "/workout-prepare",
      params: {
        routineId: routine.id,
      },
    });
  };

  const handleStartWithoutRoutine = () => {
    router.push({
      pathname: "/workout-prepare",
      params: {},
    });
  };

  if (checkingActiveWorkout) {
    return (
      <View style={[styles.container, { backgroundColor: palette.page }]}>
        <Text style={[styles.statusText, { color: palette.textSecondary }]}>
          {t("routines.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.page }]}>
      {activeWorkout ? (
        <View
          style={[
            styles.activeCard,
            { borderColor: palette.border, backgroundColor: palette.card },
          ]}
        >
          <Text style={[styles.activeTitle, { color: palette.textPrimary }]}>
            {t("workouts.activeSessionTitle")}
          </Text>
          <WorkoutStatusIndicator
            status={activeWorkout.status}
            labels={{
              inProgress: t("workouts.statusInProgress"),
              paused: t("workouts.statusPaused"),
            }}
          />
          <View style={styles.buttonWrapper}>
            <PrimaryButton
              label={t("workouts.resumeWorkoutCta")}
              onPress={handleResumeWorkoutPress}
            />
          </View>
        </View>
      ) : (
        <View style={styles.buttonWrapper}>
          <PrimaryButton label={t("workouts.startWorkoutCta")} onPress={handleStartWorkoutPress} />
        </View>
      )}
      <SelectRoutineModal
        isOpen={isSelectRoutineModalOpen}
        onClose={() => setIsSelectRoutineModalOpen(false)}
        onSelectRoutine={handleSelectRoutine}
        onStartWithoutRoutine={handleStartWithoutRoutine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  buttonWrapper: {
    marginTop: 16,
    width: "100%",
    maxWidth: 320,
  },
  activeCard: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    gap: 10,
  },
  activeTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 12,
  },
});
