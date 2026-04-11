import { AppCard } from "@/components/AppCard";
import { Chip } from "@/components/Chip";
import { ExpandedPanel } from "@/components/ExpandedPanel";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { db } from "@/db/client";
import { routineGroupRoutines } from "@/db/schema";
import { useRoutineGroups } from "@/features/routines/hooks/useRoutineGroups";
import {
  useRoutineMutations,
  type GroupSubmitPayload,
  type RoutineSubmitPayload,
} from "@/features/routines/hooks/useRoutineMutations";
import { eq } from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CreateRoutineGroupModal,
  type RoutineGroupFormInitialValues,
} from "./components/CreateRoutineGroupModal";
import { CreateRoutineModal, type RoutineFormInitialValues } from "./components/CreateRoutineModal";
import { HeaderActionButton } from "./components/HeaderActionButton";
import { RoutineGroupDetailCard } from "./components/RoutineGroupDetailCard";
import type { RoutineGroupOption } from "./components/types";

type RoutineFilterMode = "all" | "ungrouped";

type RoutineListItem = {
  id: string;
  name: string;
  detail: string | null;
  description: string | null;
  createdAt: string;
  exercises: {
    id: string;
    exerciseId: string;
    name: string;
    exerciseOrder: number;
    setsTarget: number | null;
    repsTarget: string | null;
  }[];
  groups: {
    id: string;
    name: string;
  }[];
  isUngrouped: boolean;
};

export function RoutinesTabScreen() {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const {
    routineGroups: groupedRoutines,
    ungroupedRoutines,
    loading,
    toggleGroupFavorite,
    reload,
  } = useRoutineGroups(locale);
  const { createRoutine, updateRoutine, createGroup, updateGroup, deleteRoutine, deleteGroup } =
    useRoutineMutations(locale, reload);

  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [routineFilterMode, setRoutineFilterMode] = useState<RoutineFilterMode>("all");
  const [selectedFilterGroupId, setSelectedFilterGroupId] = useState<string | null>(null);

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [routineInitialValues, setRoutineInitialValues] = useState<RoutineFormInitialValues | null>(
    null,
  );
  const [groupInitialValues, setGroupInitialValues] =
    useState<RoutineGroupFormInitialValues | null>(null);

  const getGroupLabel = (group: { name: string }) => group.name;
  const getGroupDetail = (group: { detail: string | null }) => group.detail ?? "";
  const getRoutineLabel = (routine: { name: string }) => routine.name;
  const getRoutineDetail = (routine: { detail: string | null }) => routine.detail ?? "";

  const filterableGroups = useMemo(() => groupedRoutines, [groupedRoutines]);

  const selectedGroupView = useMemo(
    () => filterableGroups.find((group) => group.id === selectedFilterGroupId) ?? null,
    [filterableGroups, selectedFilterGroupId],
  );

  const routines = useMemo<RoutineListItem[]>(() => {
    const byRoutineId = new Map<string, RoutineListItem>();

    for (const group of groupedRoutines) {
      for (const routine of group.routines) {
        const existing = byRoutineId.get(routine.id);

        if (!existing) {
          byRoutineId.set(routine.id, {
            id: routine.id,
            name: getRoutineLabel(routine),
            detail: routine.detail,
            description: routine.description,
            createdAt: routine.createdAt,
            exercises: routine.exercises,
            groups: [
              {
                id: group.id,
                name: getGroupLabel(group),
              },
            ],
            isUngrouped: false,
          });
          continue;
        }

        if (!existing.groups.some((entry) => entry.id === group.id)) {
          existing.groups.push({
            id: group.id,
            name: getGroupLabel(group),
          });
        }
      }
    }

    for (const routine of ungroupedRoutines) {
      const existing = byRoutineId.get(routine.id);

      if (!existing) {
        byRoutineId.set(routine.id, {
          id: routine.id,
          name: getRoutineLabel(routine),
          detail: routine.detail,
          description: routine.description,
          createdAt: routine.createdAt,
          exercises: routine.exercises,
          groups: [],
          isUngrouped: true,
        });
        continue;
      }

      existing.isUngrouped = existing.groups.length === 0;
    }

    return Array.from(byRoutineId.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [groupedRoutines, ungroupedRoutines]);

  const filteredRoutines = useMemo(() => {
    return routines.filter((routine) => {
      if (
        selectedFilterGroupId &&
        !routine.groups.some((group) => group.id === selectedFilterGroupId)
      ) {
        return false;
      }

      if (routineFilterMode === "ungrouped") {
        return routine.isUngrouped;
      }

      return true;
    });
  }, [routineFilterMode, routines, selectedFilterGroupId]);

  const availableRoutines = useMemo(() => {
    return routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      detail: routine.detail,
    }));
  }, [routines]);

  const availableGroups = useMemo<RoutineGroupOption[]>(
    () =>
      filterableGroups.map((group) => ({
        id: group.id,
        name: getGroupLabel(group),
        detail: getGroupDetail(group) || null,
      })),
    [filterableGroups],
  );

  const getRoutineDescription = (routine: { description: string | null }) =>
    routine.description ?? "";

  const getExerciseLabel = (exercise: { name: string }) => exercise.name;

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

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setEditingGroupId(null);
    setGroupInitialValues(null);
  };

  const openCreateRoutine = () => {
    setEditingRoutineId(null);
    setRoutineInitialValues(null);
    setShowRoutineModal(true);
  };

  const openCreateGroup = () => {
    setEditingGroupId(null);
    setGroupInitialValues(null);
    setShowGroupModal(true);
  };

  const openEditGroup = (groupId: string) => {
    const group = filterableGroups.find((entry) => entry.id === groupId);

    if (!group) {
      return;
    }

    setEditingGroupId(group.id);
    setGroupInitialValues({
      name: group.name,
      detail: group.detail ?? "",
      description: group.description ?? "",
      routineIds: group.routines.map((routine) => routine.id),
    });
    setShowGroupModal(true);
  };

  const openEditRoutine = useCallback(async (routineId: string) => {
    const routine = await db.query.routines.findFirst({
      where: (routineTable, { eq: eqQuery }) => eqQuery(routineTable.id, routineId),
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

    const groupLinks = await db.query.routineGroupRoutines.findMany({
      where: eq(routineGroupRoutines.routineId, routineId),
      orderBy: (entry, { asc }) => [asc(entry.position)],
    });

    setEditingRoutineId(routine.id);
    setRoutineInitialValues({
      name: routine.name,
      selectedGroupId: groupLinks[0]?.routineGroupId ?? null,
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

  const handleGroupSubmit = async (groupData: GroupSubmitPayload) => {
    if (editingGroupId) {
      await updateGroup(editingGroupId, groupData);
    } else {
      await createGroup(groupData);
    }

    closeGroupModal();
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

  const handleDeleteGroup = useCallback(
    (groupId: string, groupName: string) => {
      Alert.alert(
        t("routines.deleteGroupModalTitle"),
        t("routines.deleteGroupModalMessage", { name: groupName }),
        [
          {
            text: t("routines.cancelButton"),
            style: "cancel",
          },
          {
            text: t("routines.confirmDelete"),
            style: "destructive",
            onPress: async () => {
              await deleteGroup(groupId);
              setSelectedFilterGroupId((current) => (current === groupId ? null : current));
            },
          },
        ],
      );
    },
    [deleteGroup, t],
  );

  return (
    <>
      <ScrollView
        style={{ backgroundColor: palette.page }}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.description, { color: palette.textSecondary }]}>
            {t("routines.subtitle")}
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: palette.accent, borderColor: palette.accent },
            ]}
            onPress={openCreateRoutine}
          >
            <Text style={[styles.addButtonText, { color: palette.card }]}>
              + {t("routines.addRoutineButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addButton,
              { borderColor: palette.border, backgroundColor: palette.card },
            ]}
            onPress={openCreateGroup}
          >
            <Text style={[styles.addButtonText, { color: palette.textPrimary }]}>+ GROUP</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.filterLegend, { color: palette.textSecondary }]}>
          {t("routines.filterLegend")}
        </Text>

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setRoutineFilterMode("all")}
            style={[
              styles.filterButton,
              styles.filterButtonRounded,
              {
                backgroundColor: routineFilterMode === "all" ? palette.accent : palette.card,
                borderColor: palette.border,
              },
            ]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="All"
            accessibilityHint="Show all routine groups"
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: routineFilterMode === "all" ? palette.card : palette.textPrimary },
              ]}
            >
              {t("routines.filterAll")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setRoutineFilterMode("ungrouped");
              setSelectedFilterGroupId(null);
            }}
            style={[
              styles.filterButton,
              styles.filterButtonRounded,
              {
                backgroundColor: routineFilterMode === "ungrouped" ? palette.accent : palette.card,
                borderColor: palette.border,
              },
            ]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t("routines.filterUngrouped")}
            accessibilityHint={t("routines.filterUngroupedHint")}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: routineFilterMode === "ungrouped" ? palette.card : palette.textPrimary,
                },
              ]}
            >
              {t("routines.filterUngrouped")}
            </Text>
          </Pressable>
        </View>

        {filterableGroups.length > 0 ? (
          <>
            <Text style={[styles.groupFilterLegend, { color: palette.textSecondary }]}>
              {t("routines.groupFilterLegend")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupFilterRow}
            >
              <Pressable
                onPress={() => {
                  setSelectedFilterGroupId(null);
                }}
                style={[
                  styles.clearGroupFilterButton,
                  {
                    borderColor: palette.border,
                    backgroundColor: selectedFilterGroupId ? palette.card : palette.listSelected,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("routines.clearGroupFilter")}
                accessibilityHint={t("routines.clearGroupFilterHint")}
              >
                <Text
                  style={[
                    styles.clearGroupFilterIcon,
                    { color: selectedFilterGroupId ? palette.textPrimary : palette.textSecondary },
                  ]}
                >
                  ✕
                </Text>
              </Pressable>

              {filterableGroups.map((group) => (
                <View key={group.id} style={styles.groupFilterItem}>
                  <Chip
                    label={group.name}
                    selected={selectedFilterGroupId === group.id}
                    onPress={() => {
                      setRoutineFilterMode("all");
                      setSelectedFilterGroupId((current) =>
                        current === group.id ? null : group.id,
                      );
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {loading ? (
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {t("routines.loading")}
          </Text>
        ) : selectedGroupView ? (
          <View style={styles.list}>
            <RoutineGroupDetailCard
              group={selectedGroupView}
              expandedRoutineIds={expandedRoutineIds}
              onToggleRoutine={toggleRoutine}
              onToggleGroupFavorite={(groupId) => {
                void toggleGroupFavorite(groupId);
              }}
              onEditGroup={openEditGroup}
              onDeleteGroup={handleDeleteGroup}
              onEditRoutine={(routineId) => {
                void openEditRoutine(routineId);
              }}
              onDeleteRoutine={handleDeleteRoutine}
              palette={palette}
              t={t as (key: string) => string}
            />
          </View>
        ) : filteredRoutines.length === 0 ? (
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {routineFilterMode === "ungrouped"
              ? t("routines.emptyUngroupedRoutines")
              : selectedFilterGroupId
                ? t("routines.emptyGroupFilterRoutines")
                : t("routines.emptyRoutineGroups")}
          </Text>
        ) : (
          <View style={styles.list}>
            {filteredRoutines.map((routine) => (
              <AppCard key={routine.id} style={styles.routineCard}>
                <ExpandedPanel
                  title={routine.name}
                  subtitle={getRoutineDetail(routine)}
                  count={routine.exercises.length}
                  expanded={Boolean(expandedRoutineIds[routine.id])}
                  onToggle={() => toggleRoutine(routine.id)}
                  headerAction={
                    <View style={styles.headerActionRow}>
                      <HeaderActionButton
                        label={t("routines.editAction")}
                        onPress={() => {
                          void openEditRoutine(routine.id);
                        }}
                        palette={palette}
                      />
                      <HeaderActionButton
                        label={t("routines.deleteAction")}
                        onPress={() => handleDeleteRoutine(routine.id, routine.name)}
                        palette={palette}
                      />
                    </View>
                  }
                  style={[styles.groupRoutinePanel, { borderColor: palette.border }]}
                >
                  <View style={styles.routineGroupBadges}>
                    {routine.groups.map((group) => (
                      <View
                        key={`${routine.id}-${group.id}`}
                        style={[styles.groupBadge, { borderColor: palette.border }]}
                      >
                        <Text style={[styles.groupBadgeText, { color: palette.textSecondary }]}>
                          {group.name}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.exerciseList}>
                    {routine.exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.exerciseRow}>
                        <Text style={[styles.exerciseIndex, { color: palette.accent }]}>
                          {String(exercise.exerciseOrder).padStart(2, "0")}
                        </Text>
                        <View style={styles.exerciseCopy}>
                          <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>
                            {getExerciseLabel(exercise)}
                          </Text>
                          <Text style={[styles.exerciseMeta, { color: palette.textSecondary }]}>
                            {exercise.setsTarget ?? "-"} x {exercise.repsTarget ?? "-"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {getRoutineDescription(routine) ? (
                    <Text
                      style={[styles.groupRoutineDescription, { color: palette.textSecondary }]}
                    >
                      {getRoutineDescription(routine)}
                    </Text>
                  ) : null}
                </ExpandedPanel>
              </AppCard>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateRoutineModal
        visible={showRoutineModal}
        onClose={closeRoutineModal}
        routineGroups={availableGroups}
        mode={editingRoutineId ? "edit" : "create"}
        initialValues={routineInitialValues}
        onSubmit={handleRoutineSubmit}
      />

      <CreateRoutineGroupModal
        visible={showGroupModal}
        onClose={closeGroupModal}
        routines={availableRoutines}
        mode={editingGroupId ? "edit" : "create"}
        initialValues={groupInitialValues}
        onSubmit={handleGroupSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
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
  emptyState: {
    marginTop: 16,
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  groupFilterRow: {
    marginTop: 2,
    gap: 8,
    alignItems: "center",
    paddingRight: 8,
  },
  clearGroupFilterButton: {
    minHeight: 36,
    minWidth: 36,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  clearGroupFilterIcon: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  groupFilterItem: {
    flexDirection: "row",
    gap: 0,
    alignItems: "center",
  },
  filterRow: {
    marginTop: 0,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterLegend: {
    marginTop: 4,
    fontFamily: monoFont,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  groupFilterLegend: {
    marginTop: 4,
    fontFamily: monoFont,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  filterButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonRounded: {
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  filterButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routineCard: {
    gap: 8,
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routineGroupBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  groupBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groupBadgeText: {
    fontFamily: monoFont,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontWeight: "700",
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
  groupRoutinePanel: {
    gap: 0,
  },
  groupRoutineDescription: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});
