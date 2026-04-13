import { AppCard } from "@/components/AppCard";
import { ActionMenu } from "@/components/ActionMenu";
import { ControlledSearchInput } from "@/components/ControlledSearchInput";
import { ExpandedPanel } from "@/components/ExpandedPanel";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { monoFont } from "@/constants/retroTheme";
import { db } from "@/db/client";
import { usePaginatedRoutines } from "@/features/routines/hooks/usePaginatedRoutines";
import {
  useRoutineMutations,
  type RoutineSubmitPayload,
} from "@/features/routines/hooks/useRoutineMutations";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CreateRoutineModal, type RoutineFormInitialValues } from "./components/CreateRoutineModal";

export function RoutinesTabScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const showRoutineCollectionsEntry = FEATURE_FLAGS.routineCollectionsEntry;
  const {
    items: routines,
    loadingInitial,
    loadingMore,
    hasMore,
    loadMore,
    reload,
    searchQuery,
    setSearchQuery,
  } = usePaginatedRoutines(locale);

  const { createRoutine, updateRoutine, deleteRoutine } = useRoutineMutations(locale, reload);

  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineInitialValues, setRoutineInitialValues] = useState<RoutineFormInitialValues | null>(
    null,
  );

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutineIds((prev) => ({
      ...prev,
      [routineId]: !prev[routineId],
    }));
  };

  const closeRoutineModal = () => {
    setShowRoutineModal(false);
    setEditingRoutineId(null);
    setRoutineInitialValues(null);
  };

  const openCreateRoutine = () => {
    setEditingRoutineId(null);
    setRoutineInitialValues(null);
    setShowRoutineModal(true);
  };

  const openRoutineCollections = () => {
    router.push("/routine-collections");
  };

  const openEditRoutine = useCallback(async (routineId: string) => {
    const routine = await db.query.routines.findFirst({
      where: (routineTable, { eq }) => eq(routineTable.id, routineId),
      with: {
        routineTagLinks: true,
        routineExercises: {
          orderBy: (routineExercise, { asc }) => [asc(routineExercise.exerciseOrder)],
          with: {
            exercise: true,
          },
        },
      },
    });

    if (!routine) {
      return;
    }

    setEditingRoutineId(routine.id);
    setRoutineInitialValues({
      name: routine.name,
      selectedGroupId: null,
      detail: routine.detail ?? "",
      description: routine.description ?? "",
      tagIds: routine.routineTagLinks.map((tagLink) => tagLink.tagId),
      exercises: routine.routineExercises.map((entry, index) => ({
        exerciseId: entry.exerciseId,
        name: entry.exercise?.name ?? entry.exerciseId,
        exerciseOrder: entry.exerciseOrder ?? index + 1,
        setsTarget: entry.setsTarget?.toString() ?? "",
        repsTarget: entry.repsTarget ?? "",
      })),
    });
    setShowRoutineModal(true);
  }, []);

  const handleRoutineSubmit = async (routineData: RoutineSubmitPayload) => {
    if (editingRoutineId) {
      await updateRoutine(editingRoutineId, routineData);
    } else {
      await createRoutine(routineData);
    }

    closeRoutineModal();
  };

  const handleDeleteRoutine = useCallback(
    (routineId: string, routineName: string) => {
      Alert.alert(
        t("routines.deleteRoutineModalTitle"),
        t("routines.deleteRoutineModalMessage", { name: routineName }),
        [
          {
            text: t("routines.cancelButton"),
            style: "cancel",
          },
          {
            text: t("routines.confirmDelete"),
            style: "destructive",
            onPress: async () => {
              await deleteRoutine(routineId);
            },
          },
        ],
      );
    },
    [deleteRoutine, t],
  );

  return (
    <>
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: palette.page }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.header}>
              <Text style={[styles.description, { color: palette.textSecondary }]}>
                {t("routines.subtitle")}
              </Text>
              <View style={styles.headerActions}>
                {showRoutineCollectionsEntry ? (
                  <TouchableOpacity
                    style={[
                      styles.secondaryHeaderButton,
                      { borderColor: palette.border, backgroundColor: palette.card },
                    ]}
                    onPress={openRoutineCollections}
                  >
                    <Text
                      style={[styles.secondaryHeaderButtonText, { color: palette.textPrimary }]}
                    >
                      {t("routines.openCollectionsButton")}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: palette.accent, borderColor: palette.accent },
                  ]}
                  onPress={openCreateRoutine}
                >
                  <Text style={[styles.addButtonText, { color: palette.textPrimary }]}>
                    + {t("routines.addRoutineButton")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ControlledSearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("routines.searchRoutinePlaceholder")}
              variant="compact"
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {loadingInitial ? t("routines.loading") : t("routines.emptyRoutines")}
          </Text>
        }
        ListFooterComponent={
          loadingMore ? (
            <Text style={[styles.listFooterText, { color: palette.textSecondary }]}>
              {t("routines.loading")}
            </Text>
          ) : hasMore && routines.length > 0 ? (
            <Text style={[styles.listFooterText, { color: palette.textSecondary }]}>...</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <AppCard style={styles.routineCard}>
            <ExpandedPanel
              title={item.name}
              subtitle={item.detail ?? ""}
              count={item.exercises.length}
              expanded={Boolean(expandedRoutineIds[item.id])}
              onToggle={() => toggleRoutine(item.id)}
              headerAction={
                <ActionMenu
                  accessibilityLabel={t("routines.routineActionsButton")}
                  dismissLabel={t("routines.closeActionsButton")}
                  actions={[
                    {
                      key: "edit",
                      label: t("routines.editAction"),
                      onPress: () => {
                        void openEditRoutine(item.id);
                      },
                    },
                    {
                      key: "delete",
                      label: t("routines.deleteAction"),
                      onPress: () => handleDeleteRoutine(item.id, item.name),
                      destructive: true,
                    },
                  ]}
                />
              }
              style={[styles.routinePanel, { borderColor: palette.border }]}
            >
              <View style={styles.exerciseList}>
                {item.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.exerciseRow}>
                    <Text style={[styles.exerciseIndex, { color: palette.accent }]}>
                      {String(exercise.exerciseOrder).padStart(2, "0")}
                    </Text>
                    <View style={styles.exerciseCopy}>
                      <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>
                        {exercise.name}
                      </Text>
                      <Text style={[styles.exerciseMeta, { color: palette.textSecondary }]}>
                        {exercise.setsTarget ?? "-"} x {exercise.repsTarget ?? "-"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {item.description ? (
                <Text style={[styles.descriptionText, { color: palette.textSecondary }]}>
                  {item.description}
                </Text>
              ) : null}
            </ExpandedPanel>
          </AppCard>
        )}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
      />

      <CreateRoutineModal
        visible={showRoutineModal}
        onClose={closeRoutineModal}
        routineGroups={[]}
        enableRoutineGroups={false}
        mode={editingRoutineId ? "edit" : "create"}
        initialValues={routineInitialValues}
        onSubmit={handleRoutineSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  listHeader: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  description: {
    fontFamily: monoFont,
    letterSpacing: 0.2,
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryHeaderButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyState: {
    marginTop: 16,
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
  },
  listFooterText: {
    paddingVertical: 8,
    textAlign: "center",
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  listSeparator: {
    height: 12,
  },
  routineCard: {
    gap: 8,
  },
  routinePanel: {
    gap: 0,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  exerciseIndex: {
    width: 24,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  exerciseCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  exerciseMeta: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  descriptionText: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});
