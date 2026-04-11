import { AppCard } from "@/components/AppCard";
import { Badge } from "@/components/Badge";
import { ExpandedPanel } from "@/components/ExpandedPanel";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import type { AppLocale } from "@/constants/translations";
import { db } from "@/db/client";
import {
  entityTranslations,
  routineExercises,
  routineGroupRoutines,
  routineGroups,
  routineTagLinks,
  routines,
} from "@/db/schema";
import { useRoutineGroups } from "@/features/routines/hooks/useRoutineGroups";
import { eq } from "drizzle-orm";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CreateRoutineGroupModal } from "./components/CreateRoutineGroupModal";
import { CreateRoutineModal } from "./components/CreateRoutineModal";
import type { RoutineGroupOption } from "./components/types";

type RoutineFilter = "all" | "favorites";

export function RoutinesTabScreen() {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const {
    routineGroups: groupedRoutines,
    loading,
    toggleGroupFavorite,
    reload,
  } = useRoutineGroups(locale);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>("all");

  const favoriteCount = useMemo(
    () => groupedRoutines.filter((group) => group.isFavorite).length,
    [groupedRoutines],
  );

  const visibleGroups = useMemo(() => {
    if (routineFilter === "favorites") {
      return groupedRoutines.filter((group) => group.isFavorite);
    }

    return groupedRoutines;
  }, [routineFilter, groupedRoutines]);

  const getGroupLabel = (group: { name: string }) => group.name;

  const getGroupDetail = (group: { detail: string | null }) => group.detail ?? "";

  const getGroupDescription = (group: { description: string | null }) => group.description ?? "";

  const getRoutineLabel = (routine: { name: string }) => routine.name;

  const getRoutineDetail = (routine: { detail: string | null }) => routine.detail ?? "";

  const availableRoutines = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; detail: string | null }>();

    for (const group of groupedRoutines) {
      for (const routine of group.routines) {
        if (!unique.has(routine.id)) {
          unique.set(routine.id, {
            id: routine.id,
            name: getRoutineLabel(routine),
            detail: getRoutineDetail(routine) || null,
          });
        }
      }
    }

    return Array.from(unique.values());
  }, [groupedRoutines]);

  const availableGroups = useMemo<RoutineGroupOption[]>(
    () =>
      groupedRoutines.map((group) => ({
        id: group.id,
        name: getGroupLabel(group),
        detail: getGroupDetail(group) || null,
      })),
    [groupedRoutines],
  );

  const getRoutineDescription = (routine: { description: string | null }) =>
    routine.description ?? "";

  const getExerciseLabel = (exercise: { name: string }) => exercise.name;

  const getRoutinePanelKey = (groupId: string, routineId: string) => `${groupId}:${routineId}`;

  const toggleRoutine = (groupId: string, routineId: string) => {
    const panelKey = getRoutinePanelKey(groupId, routineId);

    setExpandedRoutineIds((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  };

  const normalizeSearchText = (value: string): string =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const upsertEntityTranslation = async (args: {
    entityType: "routine" | "routine_group";
    entityId: string;
    field: "name" | "detail" | "description";
    locale: AppLocale;
    value: string;
    now: string;
  }) => {
    await db
      .insert(entityTranslations)
      .values({
        entityType: args.entityType,
        entityId: args.entityId,
        field: args.field,
        locale: args.locale,
        value: args.value,
        createdAt: args.now,
        updatedAt: args.now,
      })
      .onConflictDoUpdate({
        target: [
          entityTranslations.entityType,
          entityTranslations.entityId,
          entityTranslations.field,
          entityTranslations.locale,
        ],
        set: {
          value: args.value,
          updatedAt: args.now,
        },
      });
  };

  const handleCreateRoutine = async (routineData: {
    groupId: string;
    name: string;
    detail?: string;
    description?: string;
    tagIds: string[];
    exercises: {
      exerciseId: string;
      exerciseOrder: number;
      setsTarget?: number;
      repsTarget?: number;
    }[];
  }) => {
    const routineId = `routine-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const trimmedName = routineData.name.trim();
    const trimmedDetail = routineData.detail?.trim() || null;
    const trimmedDescription = routineData.description?.trim() || null;

    await db.insert(routines).values({
      id: routineId,
      name: trimmedName,
      detail: trimmedDetail,
      description: trimmedDescription,
      isSystem: false,
      isFavorite: false,
      searchPt: locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
      searchEn: locale === "en-US" ? normalizeSearchText(trimmedName) : null,
      createdAt,
    });

    const currentLinks = await db
      .select({
        routineGroupId: routineGroupRoutines.routineGroupId,
      })
      .from(routineGroupRoutines)
      .where(eq(routineGroupRoutines.routineGroupId, routineData.groupId));

    const nextPosition = currentLinks.length + 1;

    await db.insert(routineGroupRoutines).values({
      routineGroupId: routineData.groupId,
      routineId,
      position: nextPosition,
      label: null,
    });

    if (routineData.tagIds.length > 0) {
      await db.insert(routineTagLinks).values(
        routineData.tagIds.map((tagId) => ({
          routineId,
          tagId,
        })),
      );
    }

    if (routineData.exercises.length > 0) {
      await db.insert(routineExercises).values(
        routineData.exercises.map((exercise, index) => ({
          id: `rte-${routineId}-${index + 1}`,
          routineId,
          exerciseId: exercise.exerciseId,
          exerciseOrder: exercise.exerciseOrder,
          setsTarget: exercise.setsTarget ?? null,
          repsTarget: exercise.repsTarget?.toString() ?? null,
        })),
      );
    }

    await upsertEntityTranslation({
      entityType: "routine",
      entityId: routineId,
      field: "name",
      locale,
      value: trimmedName,
      now: createdAt,
    });

    if (trimmedDetail) {
      await upsertEntityTranslation({
        entityType: "routine",
        entityId: routineId,
        field: "detail",
        locale,
        value: trimmedDetail,
        now: createdAt,
      });
    }

    if (trimmedDescription) {
      await upsertEntityTranslation({
        entityType: "routine",
        entityId: routineId,
        field: "description",
        locale,
        value: trimmedDescription,
        now: createdAt,
      });
    }

    await reload();
    setShowCreateModal(false);
  };

  const handleCreateGroup = async (groupData: {
    name: string;
    detail?: string;
    description?: string;
    routineIds: string[];
  }) => {
    const groupId = `rg-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const trimmedName = groupData.name.trim();
    const trimmedDetail = groupData.detail?.trim() || null;
    const trimmedDescription = groupData.description?.trim() || null;

    await db.insert(routineGroups).values({
      id: groupId,
      name: trimmedName,
      detail: trimmedDetail,
      description: trimmedDescription,
      isSystem: false,
      isFavorite: false,
      searchPt: locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
      searchEn: locale === "en-US" ? normalizeSearchText(trimmedName) : null,
      createdAt,
    });

    await upsertEntityTranslation({
      entityType: "routine_group",
      entityId: groupId,
      field: "name",
      locale,
      value: trimmedName,
      now: createdAt,
    });

    if (trimmedDetail) {
      await upsertEntityTranslation({
        entityType: "routine_group",
        entityId: groupId,
        field: "detail",
        locale,
        value: trimmedDetail,
        now: createdAt,
      });
    }

    if (trimmedDescription) {
      await upsertEntityTranslation({
        entityType: "routine_group",
        entityId: groupId,
        field: "description",
        locale,
        value: trimmedDescription,
        now: createdAt,
      });
    }

    if (groupData.routineIds.length > 0) {
      await db.insert(routineGroupRoutines).values(
        groupData.routineIds.map((routineId, index) => ({
          routineGroupId: groupId,
          routineId,
          position: index + 1,
          label: null,
        })),
      );
    }

    await reload();
  };

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
            onPress={() => setShowCreateModal(true)}
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
            onPress={() => setShowCreateGroupModal(true)}
          >
            <Text style={[styles.addButtonText, { color: palette.textPrimary }]}>+ GROUP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setRoutineFilter("all")}
            style={[
              styles.filterButton,
              {
                backgroundColor: routineFilter === "all" ? palette.accent : palette.card,
                borderColor: palette.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="All"
            accessibilityHint="Show all routine groups"
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: routineFilter === "all" ? palette.card : palette.textPrimary },
              ]}
            >
              {t("routines.filterAll")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRoutineFilter("favorites")}
            style={[
              styles.filterButton,
              {
                backgroundColor: routineFilter === "favorites" ? palette.accent : palette.card,
                borderColor: palette.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Favorites"
            accessibilityHint="Show only favorite groups"
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: routineFilter === "favorites" ? palette.card : palette.textPrimary,
                },
              ]}
            >
              {t("routines.filterFavorites")} ({favoriteCount})
            </Text>
          </Pressable>

          <Badge
            value={visibleGroups.length}
            textColor={palette.accent}
            borderColor={palette.accent}
            backgroundColor={palette.card}
          />
        </View>

        {loading ? (
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {t("routines.loading")}
          </Text>
        ) : visibleGroups.length === 0 ? (
          <Text style={[styles.emptyState, { color: palette.textSecondary }]}>
            {routineFilter === "favorites" ? "No favorite groups yet." : "No routine groups found."}
          </Text>
        ) : (
          <View style={styles.list}>
            {visibleGroups.map((group) => (
              <AppCard key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeaderRow}>
                  <View style={styles.groupHeaderCopy}>
                    <View style={styles.groupTitleRow}>
                      <Text style={[styles.groupTitle, { color: palette.textPrimary }]}>
                        {getGroupLabel(group)}
                      </Text>
                      <Pressable
                        onPress={() => {
                          void toggleGroupFavorite(group.id);
                        }}
                        style={[
                          styles.favoriteButton,
                          {
                            borderColor: "transparent",
                            backgroundColor: "transparent",
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={
                          group.isFavorite
                            ? "Remove group from favorites"
                            : "Mark group as favorite"
                        }
                        accessibilityHint="Toggle this routine group as favorite"
                      >
                        <Text
                          style={[
                            styles.favoriteButtonText,
                            {
                              color: group.isFavorite ? palette.accent : palette.textSecondary,
                            },
                          ]}
                        >
                          {group.isFavorite ? "★" : "☆"}
                        </Text>
                      </Pressable>
                    </View>

                    {getGroupDetail(group) ? (
                      <Text style={[styles.groupSubtitle, { color: palette.textSecondary }]}>
                        {getGroupDetail(group)}
                      </Text>
                    ) : null}
                  </View>

                  <Badge
                    value={group.routines.length}
                    textColor={palette.accent}
                    borderColor={palette.accent}
                    backgroundColor={palette.card}
                  />
                </View>

                <View style={styles.groupRoutinesList}>
                  {group.routines.map((routine) => (
                    <ExpandedPanel
                      key={`${group.id}-${routine.id}`}
                      title={getRoutineLabel(routine)}
                      subtitle={getRoutineDetail(routine)}
                      count={routine.exercises.length}
                      expanded={Boolean(
                        expandedRoutineIds[getRoutinePanelKey(group.id, routine.id)],
                      )}
                      onToggle={() => toggleRoutine(group.id, routine.id)}
                      style={[styles.groupRoutinePanel, { borderColor: palette.border }]}
                    >
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
                  ))}
                </View>

                {getGroupDescription(group) ? (
                  <>
                    <View style={[styles.sectionDivider, { backgroundColor: palette.border }]} />
                    <Text style={[styles.descriptionBlock, { color: palette.textSecondary }]}>
                      {getGroupDescription(group)}
                    </Text>
                  </>
                ) : null}
              </AppCard>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateRoutineModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        routineGroups={availableGroups}
        onSubmit={handleCreateRoutine}
      />

      <CreateRoutineGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        routines={availableRoutines}
        onSubmit={handleCreateGroup}
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
  filterRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  favoriteButton: {
    minHeight: 32,
    minWidth: 32,
    paddingHorizontal: 2,
    paddingBlock: 0,
    paddingBottom: 4,
    borderWidth: 0,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButtonText: {
    fontFamily: monoFont,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  groupHeaderCopy: {
    flex: 1,
    gap: 8,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 32,
  },
  groupTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: monoFont,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  groupSubtitle: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
  },
  groupCard: {
    gap: 12,
  },
  sectionDivider: {
    height: 1,
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
  descriptionBlock: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  groupRoutinesList: {
    gap: 8,
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
