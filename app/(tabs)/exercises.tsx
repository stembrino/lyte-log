import { AppCard } from "@/components/AppCard";
import { Badge } from "@/components/Badge";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useI18n } from "@/components/providers/i18n-provider";
import { FALLBACK_MUSCLE_GROUPS } from "@/constants/fallback/muscleGroups";
import { monoFont } from "@/constants/retroTheme";
import { db } from "@/db/client";
import {
  entityTranslations,
  exercises as exercisesTable,
  muscleGroups as muscleGroupsTable,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  isCustom: boolean;
};

type MuscleGroupOption = {
  id: string;
  name: MuscleGroup;
  label: string;
};

const muscleGroupValues: MuscleGroup[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
  "Other",
];

function isMuscleGroup(value: string): value is MuscleGroup {
  return muscleGroupValues.includes(value as MuscleGroup);
}

const initialMuscleGroupOptions: MuscleGroupOption[] = FALLBACK_MUSCLE_GROUPS.map((group) => ({
  id: group.id,
  name: group.name as MuscleGroup,
  label: group.labelEn,
}));

export default function ExercisesScreen() {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();

  const [exerciseName, setExerciseName] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup>("Chest");
  const [muscleGroupOptions, setMuscleGroupOptions] =
    useState<MuscleGroupOption[]>(initialMuscleGroupOptions);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseNameFocused, setExerciseNameFocused] = useState(false);

  useEffect(() => {
    let mounted = true;

    db.select()
      .from(muscleGroupsTable)
      .then(async (rows) => {
        if (!mounted) return;

        const ids = rows.map((row) => row.id);
        const translationRows =
          ids.length === 0
            ? []
            : await db
                .select({
                  entityId: entityTranslations.entityId,
                  value: entityTranslations.value,
                })
                .from(entityTranslations)
                .where(
                  and(
                    eq(entityTranslations.entityType, "muscle_group"),
                    eq(entityTranslations.field, "name"),
                    eq(entityTranslations.locale, locale),
                    inArray(entityTranslations.entityId, ids),
                  ),
                );

        const labelMap = new Map(translationRows.map((row) => [row.entityId, row.value]));

        const hydrated = rows
          .filter((row) => isMuscleGroup(row.name))
          .map((row) => ({
            id: row.id,
            name: row.name as MuscleGroup,
            label: labelMap.get(row.id) ?? row.name,
          }))
          .sort((a, b) => muscleGroupValues.indexOf(a.name) - muscleGroupValues.indexOf(b.name));

        if (hydrated.length > 0) {
          setMuscleGroupOptions(hydrated);
        }
      })
      .catch(() => {
        // Keep seeded fallback list when DB read fails.
      });

    return () => {
      mounted = false;
    };
  }, [locale]);

  useEffect(() => {
    let mounted = true;

    db.select()
      .from(exercisesTable)
      .then(async (rows) => {
        if (!mounted) return;

        const ids = rows.map((row) => row.id);
        const translationRows =
          ids.length === 0
            ? []
            : await db
                .select({
                  entityId: entityTranslations.entityId,
                  value: entityTranslations.value,
                })
                .from(entityTranslations)
                .where(
                  and(
                    eq(entityTranslations.entityType, "exercise"),
                    eq(entityTranslations.field, "name"),
                    eq(entityTranslations.locale, locale),
                    inArray(entityTranslations.entityId, ids),
                  ),
                );

        const labelMap = new Map(translationRows.map((row) => [row.entityId, row.value]));

        const hydrated = rows
          .filter((row) => isMuscleGroup(row.muscleGroup))
          .map((row) => ({
            id: row.id,
            name: labelMap.get(row.id) ?? row.name,
            muscleGroup: row.muscleGroup as MuscleGroup,
            isCustom: row.isCustom,
          }));

        setExercises(hydrated);
      })
      .catch(() => {
        // Keep empty list when DB read fails.
      });

    return () => {
      mounted = false;
    };
  }, [locale]);

  const muscleGroupLabels = useMemo(
    () => new Map(muscleGroupOptions.map((group) => [group.name, group.label])),
    [muscleGroupOptions],
  );

  const addExercise = async () => {
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
      isCustom: true,
    };

    try {
      await db.insert(exercisesTable).values({
        id: newExercise.id,
        name: newExercise.name,
        muscleGroup: newExercise.muscleGroup,
        isCustom: true,
      });

      setExercises((previous) => [newExercise, ...previous]);
      setExerciseName("");
    } catch {
      Alert.alert(
        t("exercises.alerts.duplicateExerciseTitle"),
        t("exercises.alerts.duplicateExerciseMessage"),
      );
    }
  };

  const getExerciseLabel = (exercise: Exercise) => exercise.name;

  const userExercises = useMemo(
    () => exercises.filter((exercise) => exercise.isCustom),
    [exercises],
  );

  const systemExercises = useMemo(
    () => exercises.filter((exercise) => !exercise.isCustom),
    [exercises],
  );

  const requestDeleteExercise = (exercise: Exercise) => {
    if (!exercise.isCustom) return;

    Alert.alert(
      t("exercises.deleteModalTitle"),
      t("exercises.deleteModalMessage", { name: getExerciseLabel(exercise) }),
      [
        {
          text: t("exercises.cancel"),
          style: "cancel",
        },
        {
          text: t("exercises.confirmDelete"),
          style: "destructive",
          onPress: async () => {
            try {
              await db.delete(exercisesTable).where(eq(exercisesTable.id, exercise.id));
              setExercises((previous) => previous.filter((item) => item.id !== exercise.id));
            } catch {
              // Keep state as-is when delete fails.
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={{ backgroundColor: palette.page }} contentContainerStyle={styles.container}>
      <Text style={[styles.screenDescription, { color: palette.textSecondary }]}>
        {t("exercises.subtitle")}
      </Text>

      <AppCard title={t("exercises.createExercise")}>
        <View style={[styles.titleDivider, { backgroundColor: palette.border }]} />

        <View
          style={[
            styles.inputShell,
            {
              borderColor: exerciseNameFocused ? palette.accent : palette.inputBorder,
              borderWidth: exerciseNameFocused ? 2 : 1,
              backgroundColor: palette.inputBg,
            },
          ]}
        >
          <Text
            style={[
              styles.inputPrompt,
              {
                color: exerciseNameFocused ? palette.accent : palette.textSecondary,
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
            style={[styles.input, { color: palette.textPrimary }]}
          />
        </View>

        <Text style={[styles.label, { color: palette.textPrimary }]}>
          {t("exercises.muscleGroup")}
        </Text>
        <View style={styles.tagsWrap}>
          {muscleGroupOptions.map((group) => {
            const isActive = selectedMuscleGroup === group.name;
            return (
              <Pressable
                key={group.id}
                onPress={() => setSelectedMuscleGroup(group.name)}
                style={[
                  styles.tag,
                  {
                    borderColor: isActive ? palette.accent : palette.tagBorder,
                    backgroundColor: isActive ? palette.accent : palette.tag,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: isActive ? "#ffffff" : palette.tagText }]}>
                  {group.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton label={t("exercises.addExercise")} onPress={addExercise} />
      </AppCard>

      <AppCard
        title={t("exercises.myExercises")}
        rightAdornment={
          <Badge
            value={userExercises.length}
            textColor={palette.accent}
            borderColor={palette.accent}
            backgroundColor={palette.card}
          />
        }
      >
        <View style={[styles.titleDivider, { backgroundColor: palette.border }]} />

        {userExercises.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            {t("exercises.emptyUserExercises")}
          </Text>
        ) : (
          <View style={styles.listWrap}>
            {userExercises.map((exercise) => (
              <View
                key={exercise.id}
                style={[
                  styles.listItem,
                  {
                    borderColor: palette.inputBorder,
                    backgroundColor: palette.inputBg,
                  },
                ]}
              >
                <View style={styles.listItemHeaderRow}>
                  <View style={styles.listItemTextWrap}>
                    <Text style={[styles.listItemTitle, { color: palette.textPrimary }]}>
                      {getExerciseLabel(exercise)}
                    </Text>
                    <Text style={[styles.listItemSubtitle, { color: palette.textSecondary }]}>
                      {muscleGroupLabels.get(exercise.muscleGroup) ?? exercise.muscleGroup}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => requestDeleteExercise(exercise)}
                    style={[
                      styles.deleteButton,
                      {
                        borderColor: palette.border,
                        backgroundColor: palette.card,
                      },
                    ]}
                  >
                    <Text style={[styles.deleteButtonText, { color: palette.accent }]}>
                      {t("exercises.deleteExercise")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard
        title={t("exercises.systemExercises")}
        rightAdornment={
          <Badge
            value={systemExercises.length}
            textColor={palette.textSecondary}
            borderColor={palette.border}
            backgroundColor={palette.card}
          />
        }
      >
        <View style={[styles.titleDivider, { backgroundColor: palette.border }]} />

        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
          {t("exercises.systemExercisesHint")}
        </Text>

        {systemExercises.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            {t("exercises.emptySystemExercises")}
          </Text>
        ) : (
          <View style={styles.listWrap}>
            {systemExercises.map((exercise) => (
              <View
                key={exercise.id}
                style={[
                  styles.listItem,
                  {
                    borderColor: palette.inputBorder,
                    backgroundColor: palette.inputBg,
                  },
                ]}
              >
                <Text style={[styles.listItemTitle, { color: palette.textPrimary }]}>
                  {getExerciseLabel(exercise)}
                </Text>
                <Text style={[styles.listItemSubtitle, { color: palette.textSecondary }]}>
                  {muscleGroupLabels.get(exercise.muscleGroup) ?? exercise.muscleGroup}
                </Text>
              </View>
            ))}
          </View>
        )}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  screenDescription: {
    marginTop: 4,
    fontFamily: monoFont,
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
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
  },
  tagText: {
    fontFamily: monoFont,
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  listWrap: {
    gap: 8,
  },
  listItem: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
  },
  listItemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  listItemTextWrap: {
    flex: 1,
  },
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
  deleteButton: {
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 32,
    minWidth: 70,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  helperText: {
    marginTop: -2,
    fontFamily: monoFont,
    fontSize: 12,
  },
  emptyText: {
    fontFamily: monoFont,
  },
});
