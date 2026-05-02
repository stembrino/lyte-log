import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { CreateExerciseModal } from "./components/CreateExerciseModal";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExercisesEmptyState } from "./components/ExercisesEmptyState";
import { ExercisesListHeader } from "./components/ExercisesListHeader";
import { useExerciseMutations } from "./hooks/useExerciseMutations";
import { useMuscleGroups } from "./hooks/useMuscleGroups";
import type {
  ExerciseLibraryItem,
  ExerciseSourceFilter,
} from "./hooks/usePaginatedExerciseLibrary";
import { usePaginatedExerciseLibrary } from "./hooks/usePaginatedExerciseLibrary";

export default function ExercisesTabScreen() {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ExerciseSourceFilter>("all");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseLibraryItem | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const { items, totalCount, hasMore, loadMore, loadingInitial, loadingMore, reload } =
    usePaginatedExerciseLibrary({
      query,
      locale,
      excludeIds: [],
      muscleGroups: [],
      sourceFilter,
    });
  const { items: muscleGroups } = useMuscleGroups();
  const { createExercise, deleteExercise, updateExercise } = useExerciseMutations(reload);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleDelete = useCallback(
    (item: ExerciseLibraryItem) => {
      if (!item.isCustom) {
        return;
      }

      Alert.alert(
        t("exercises.deleteModalTitle"),
        t("exercises.deleteModalMessage", { name: item.name }),
        [
          {
            text: t("exercises.cancel"),
            style: "cancel",
          },
          {
            text: t("exercises.confirmDelete"),
            style: "destructive",
            onPress: () => {
              void deleteExercise(item.id);
            },
          },
        ],
      );
    },
    [deleteExercise, t],
  );

  const handleEdit = useCallback((item: ExerciseLibraryItem) => {
    if (!item.isCustom) {
      return;
    }

    setEditingExercise(item);
  }, []);

  const handleCreateExercise = useCallback(
    async (payload: { name: string; muscleGroup: string }) => {
      await createExercise(payload);
    },
    [createExercise],
  );

  const handleUpdateExercise = useCallback(
    async (payload: { name: string; muscleGroup: string }) => {
      if (!editingExercise) {
        return;
      }

      await updateExercise(editingExercise.id, payload);
      setEditingExercise(null);
    },
    [editingExercise, updateExercise],
  );

  const handleToggleCard = useCallback((itemId: string) => {
    setExpandedExerciseId((current) => (current === itemId ? null : itemId));
  }, []);

  const listHeader = useMemo(
    () => (
      <ExercisesListHeader
        count={totalCount}
        query={query}
        sourceFilter={sourceFilter}
        onChangeQuery={setQuery}
        onChangeSourceFilter={setSourceFilter}
        onPressCreate={() => setCreateModalVisible(true)}
      />
    ),
    [sourceFilter, totalCount, query],
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.page }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ExerciseCard
              item={item}
              expanded={expandedExerciseId === item.id}
              onToggle={handleToggleCard}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loadingInitial ? <ExercisesEmptyState /> : null}
        ListFooterComponent={
          loadingMore ? (
            <Text style={[styles.footerText, { color: palette.textSecondary }]}>...</Text>
          ) : !loadingInitial && !hasMore && items.length > 0 ? (
            <Text style={[styles.footerText, { color: palette.textSecondary }]}>
              {t("exercises.statusExercises", { count: items.length })}
            </Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
      />

      <CreateExerciseModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        muscleGroups={muscleGroups}
        onSubmit={handleCreateExercise}
        prefillName={query}
      />

      <CreateExerciseModal
        visible={editingExercise !== null}
        onClose={() => setEditingExercise(null)}
        muscleGroups={muscleGroups}
        onSubmit={handleUpdateExercise}
        mode="edit"
        initialValues={
          editingExercise
            ? {
                name: editingExercise.name,
                muscleGroup: editingExercise.muscleGroup,
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  cardWrap: {
    paddingHorizontal: 16,
  },
  separator: {
    height: 8,
  },
  footerText: {
    fontFamily: monoFont,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
