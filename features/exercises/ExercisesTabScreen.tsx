import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { CreateExerciseModal } from "./components/CreateExerciseModal";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExercisesEmptyState } from "./components/ExercisesEmptyState";
import { ExercisesListHeader } from "./components/ExercisesListHeader";
import { useExerciseMutations } from "./hooks/useExerciseMutations";
import { useMuscleGroups } from "./hooks/useMuscleGroups";
import type { ExerciseLibraryItem } from "./hooks/usePaginatedExerciseLibrary";
import { usePaginatedExerciseLibrary } from "./hooks/usePaginatedExerciseLibrary";

export default function ExercisesTabScreen() {
  const { t, locale } = useI18n();
  const palette = useRetroPalette();
  const [query, setQuery] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const { items, hasMore, loadMore, loadingInitial, loadingMore, reload } =
    usePaginatedExerciseLibrary({
      query,
      locale,
      excludeIds: [],
    });
  const { items: muscleGroups } = useMuscleGroups();
  const { createExercise, deleteExercise } = useExerciseMutations(reload);

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

  const handleEdit = useCallback((_item: ExerciseLibraryItem) => {
    return;
  }, []);

  const handleCreateExercise = useCallback(
    async (payload: { name: string; muscleGroup: string }) => {
      await createExercise(payload);
    },
    [createExercise],
  );

  const handleToggleCard = useCallback((itemId: string) => {
    setExpandedExerciseId((current) => (current === itemId ? null : itemId));
  }, []);

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
        ListHeaderComponent={
          <ExercisesListHeader
            count={items.length}
            query={query}
            onChangeQuery={setQuery}
            onPressCreate={() => setCreateModalVisible(true)}
          />
        }
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
