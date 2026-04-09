import { useColorScheme } from "@/components/contexts/useColorScheme";
import { useI18n } from "@/components/i18n-provider";
import { getRetroPalette, monoFont } from "@/constants/retroTheme";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Full Body"
  | "Other";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
};

type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
};

const muscleGroups: MuscleGroup[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
  "Other",
];

const initialExercises: Exercise[] = [
  { id: "ex-1", name: "Bench Press", muscleGroup: "Chest" },
  { id: "ex-2", name: "Squat", muscleGroup: "Legs" },
  { id: "ex-3", name: "Deadlift", muscleGroup: "Back" },
];

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const palette = getRetroPalette(colorScheme);

  const [exerciseName, setExerciseName] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState<MuscleGroup>("Chest");
  const [routineName, setRoutineName] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exerciseNameFocused, setExerciseNameFocused] = useState(false);
  const [routineNameFocused, setRoutineNameFocused] = useState(false);

  const selectedCountLabel = useMemo(
    () => t("exercises.selectedCount", { count: selectedExerciseIds.length }),
    [selectedExerciseIds.length, t],
  );

  const addExercise = () => {
    const name = exerciseName.trim();
    if (!name) {
      Alert.alert(
        t("exercises.alerts.missingExerciseNameTitle"),
        t("exercises.alerts.missingExerciseNameMessage"),
      );
      return;
    }

    const duplicated = exercises.some(
      (exercise) => exercise.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicated) {
      Alert.alert(
        t("exercises.alerts.duplicateExerciseTitle"),
        t("exercises.alerts.duplicateExerciseMessage"),
      );
      return;
    }

    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
      name,
      muscleGroup: selectedMuscleGroup,
    };

    setExercises((previous) => [newExercise, ...previous]);
    setExerciseName("");
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((previous) =>
      previous.includes(exerciseId)
        ? previous.filter((id) => id !== exerciseId)
        : [...previous, exerciseId],
    );
  };

  const createRoutine = () => {
    const name = routineName.trim();
    if (!name) {
      Alert.alert(
        t("exercises.alerts.missingRoutineNameTitle"),
        t("exercises.alerts.missingRoutineNameMessage"),
      );
      return;
    }

    if (selectedExerciseIds.length === 0) {
      Alert.alert(
        t("exercises.alerts.noExercisesSelectedTitle"),
        t("exercises.alerts.noExercisesSelectedMessage"),
      );
      return;
    }

    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      name,
      exerciseIds: selectedExerciseIds,
    };

    setRoutines((previous) => [newRoutine, ...previous]);
    setRoutineName("");
    setSelectedExerciseIds([]);
    Alert.alert(
      t("exercises.alerts.routineCreatedTitle"),
      t("exercises.alerts.routineCreatedMessage", { name }),
    );
  };

  const getExerciseNames = (exerciseIds: string[]) =>
    exerciseIds
      .map((id) => exercises.find((exercise) => exercise.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  return (
    <ScrollView
      style={{ backgroundColor: palette.page }}
      contentContainerStyle={styles.container}
    >
      <Text
        style={[styles.screenDescription, { color: palette.textSecondary }]}
      >
        {t("exercises.subtitle")}
      </Text>

      <View
        style={[
          styles.statusStrip,
          {
            borderColor: palette.border,
            backgroundColor: palette.card,
          },
        ]}
      >
        <Text style={[styles.statusText, { color: palette.textPrimary }]}>
          {t("exercises.statusExercises", { count: exercises.length })}
        </Text>
        <Text style={[styles.statusPipe, { color: palette.textSecondary }]}>
          |
        </Text>
        <Text style={[styles.statusText, { color: palette.textPrimary }]}>
          {t("exercises.statusRoutines", { count: routines.length })}
        </Text>
        <Text style={[styles.statusPipe, { color: palette.textSecondary }]}>
          |
        </Text>
        <Text style={[styles.statusText, { color: palette.textPrimary }]}>
          {t("exercises.statusSelected", { count: selectedExerciseIds.length })}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View
          style={[styles.cardAccentBar, { backgroundColor: palette.accent }]}
        />
        <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
          {t("exercises.createExercise")}
        </Text>
        <View
          style={[styles.titleDivider, { backgroundColor: palette.border }]}
        />
        <View
          style={[
            styles.inputShell,
            {
              borderColor: exerciseNameFocused
                ? palette.accent
                : palette.inputBorder,
              borderWidth: exerciseNameFocused ? 2 : 1,
              backgroundColor: palette.inputBg,
            },
          ]}
        >
          <Text
            style={[
              styles.inputPrompt,
              {
                color: exerciseNameFocused
                  ? palette.accent
                  : palette.textSecondary,
              },
            ]}
          >
            +
          </Text>
          <TextInput
            value={exerciseName}
            onChangeText={setExerciseName}
            onFocus={() => setExerciseNameFocused(true)}
            onBlur={() => setExerciseNameFocused(false)}
            placeholder={t("exercises.exerciseName")}
            placeholderTextColor={palette.textSecondary}
            style={[
              styles.input,
              {
                color: palette.textPrimary,
              },
            ]}
          />
        </View>

        <Text style={[styles.label, { color: palette.textPrimary }]}>
          {t("exercises.muscleGroup")}
        </Text>
        <View style={styles.tagsWrap}>
          {muscleGroups.map((group) => {
            const isActive = selectedMuscleGroup === group;
            return (
              <Pressable
                key={group}
                onPress={() => setSelectedMuscleGroup(group)}
                style={[
                  styles.tag,
                  {
                    borderColor: palette.tagBorder,
                    backgroundColor: palette.tag,
                  },
                  isActive && styles.tagActive,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: palette.tagText },
                    isActive && styles.tagTextActive,
                  ]}
                >
                  {group}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={addExercise}>
          {({ pressed }) => (
            <View
              style={[
                styles.primaryButton,
                {
                  backgroundColor: pressed ? palette.card : palette.accent,
                  borderColor: palette.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: pressed ? palette.accent : "#ffffff" },
                ]}
              >
                [{t("exercises.addExercise")}]
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View
          style={[styles.cardAccentBar, { backgroundColor: palette.accent }]}
        />
        <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
          {t("exercises.createRoutine")}
        </Text>
        <View
          style={[styles.titleDivider, { backgroundColor: palette.border }]}
        />
        <View
          style={[
            styles.inputShell,
            {
              borderColor: routineNameFocused
                ? palette.accent
                : palette.inputBorder,
              borderWidth: routineNameFocused ? 2 : 1,
              backgroundColor: palette.inputBg,
            },
          ]}
        >
          <Text
            style={[
              styles.inputPrompt,
              {
                color: routineNameFocused
                  ? palette.accent
                  : palette.textSecondary,
              },
            ]}
          >
            +
          </Text>
          <TextInput
            value={routineName}
            onChangeText={setRoutineName}
            onFocus={() => setRoutineNameFocused(true)}
            onBlur={() => setRoutineNameFocused(false)}
            placeholder={t("exercises.routineName")}
            placeholderTextColor={palette.textSecondary}
            style={[
              styles.input,
              {
                color: palette.textPrimary,
              },
            ]}
          />
        </View>

        <Text style={[styles.label, { color: palette.textPrimary }]}>
          {t("exercises.pickExercises")}
        </Text>
        <Text style={[styles.helper, { color: palette.textSecondary }]}>
          {selectedCountLabel}
        </Text>

        <View style={styles.listWrap}>
          {exercises.map((exercise) => {
            const selected = selectedExerciseIds.includes(exercise.id);
            return (
              <Pressable
                key={exercise.id}
                onPress={() => toggleExercise(exercise.id)}
                style={[
                  styles.listItem,
                  {
                    borderColor: palette.inputBorder,
                    backgroundColor: palette.inputBg,
                  },
                  selected && styles.listItemSelected,
                  selected && {
                    borderColor: palette.accent,
                    backgroundColor: palette.listSelected,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.listItemTitle,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {exercise.name}
                  </Text>
                  <Text
                    style={[
                      styles.listItemSubtitle,
                      { color: palette.textSecondary },
                    ]}
                  >
                    {exercise.muscleGroup}
                  </Text>
                </View>
                <Text style={styles.checkbox}>
                  {selected ? t("exercises.selected") : t("exercises.select")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={createRoutine}>
          {({ pressed }) => (
            <View
              style={[
                styles.primaryButton,
                {
                  backgroundColor: pressed ? palette.card : palette.accent,
                  borderColor: palette.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: pressed ? palette.accent : "#ffffff" },
                ]}
              >
                [{t("exercises.createRoutine")}]
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View
          style={[styles.cardAccentBar, { backgroundColor: palette.accent }]}
        />
        <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
          {t("exercises.myRoutines")}
        </Text>
        <View
          style={[styles.titleDivider, { backgroundColor: palette.border }]}
        />
        {routines.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            {t("exercises.emptyRoutines")}
          </Text>
        ) : (
          routines.map((routine) => (
            <View
              key={routine.id}
              style={[
                styles.routineItem,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.routineBg,
                },
              ]}
            >
              <View style={styles.routineHeaderRow}>
                <Text style={[styles.routineIndex, { color: palette.accent }]}>
                  #
                  {String(routines.length - routines.indexOf(routine)).padStart(
                    2,
                    "0",
                  )}
                </Text>
                <Text
                  style={[styles.routineName, { color: palette.textPrimary }]}
                >
                  {routine.name}
                </Text>
              </View>
              <Text
                style={[
                  styles.routineExercises,
                  { color: palette.textSecondary },
                ]}
              >
                {getExerciseNames(routine.exerciseIds)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  screenDescription: {
    marginTop: 4,
    fontFamily: monoFont,
  },
  card: {
    borderRadius: 2,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardAccentBar: {
    height: 2,
    marginBottom: 2,
  },
  statusStrip: {
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontFamily: monoFont,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusPipe: {
    fontFamily: monoFont,
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  titleDivider: {
    height: 1,
    marginTop: -2,
  },
  label: {
    fontWeight: "600",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  helper: {
    marginTop: -6,
    fontFamily: monoFont,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 4,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  inputShell: {
    minHeight: 44,
    borderRadius: 2,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  inputPrompt: {
    fontFamily: monoFont,
    fontWeight: "700",
    fontSize: 16,
    marginRight: 4,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagActive: {
    backgroundColor: "#E95420",
    borderColor: "#E95420",
  },
  tagText: {
    fontFamily: monoFont,
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tagTextActive: {
    color: "#ffffff",
  },
  listWrap: {
    gap: 8,
  },
  listItem: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemSelected: {},
  listItemTitle: {
    fontWeight: "600",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  listItemSubtitle: {
    marginTop: 2,
    fontFamily: monoFont,
  },
  checkbox: {
    color: "#E95420",
    fontFamily: monoFont,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  primaryButton: {
    borderRadius: 2,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: monoFont,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emptyText: {
    fontFamily: monoFont,
  },
  routineItem: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
  },
  routineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routineIndex: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  routineName: {
    fontWeight: "700",
    fontFamily: monoFont,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  routineExercises: {
    marginTop: 4,
    fontFamily: monoFont,
  },
});
