import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ControlledSearchInput } from "@/components/ControlledSearchInput";
import { monoFont } from "@/constants/retroTheme";
import {
  usePaginatedExerciseLibrary,
  type ExerciseLibraryItem,
} from "@/features/exercises/hooks/usePaginatedExerciseLibrary";
import type { AppLocale } from "@/components/providers/i18n-provider";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PrepareWorkoutExercisePickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  locale: AppLocale;
  excludeExerciseIds: string[];
  onAddExercise: (exercise: ExerciseLibraryItem) => void;
  title: string;
  hint: string;
  searchPlaceholder: string;
  addButtonLabel: string;
  emptyLabel: string;
  loadingLabel: string;
};

export function PrepareWorkoutExercisePickerModal({
  isOpen,
  onClose,
  locale,
  excludeExerciseIds,
  onAddExercise,
  title,
  hint,
  searchPlaceholder,
  addButtonLabel,
  emptyLabel,
  loadingLabel,
}: PrepareWorkoutExercisePickerModalProps) {
  const palette = useRetroPalette();
  const [searchQuery, setSearchQuery] = useState("");

  const { items, hasMore, loadingInitial, loadingMore, loadMore } = usePaginatedExerciseLibrary({
    query: searchQuery,
    locale,
    excludeIds: excludeExerciseIds,
  });

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleAddExercise = (exercise: ExerciseLibraryItem) => {
    onAddExercise(exercise);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: palette.card }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <FontAwesome name="times-circle-o" size={22} color={palette.textPrimary} />
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: palette.textSecondary }]}>{hint}</Text>

          <ControlledSearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            variant="compact"
          />

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
                {loadingInitial ? loadingLabel : emptyLabel}
              </Text>
            }
            ListFooterComponent={
              loadingMore ? (
                <Text style={[styles.paginationHint, { color: palette.textSecondary }]}>
                  {loadingLabel}
                </Text>
              ) : hasMore ? (
                <Text style={[styles.paginationHint, { color: palette.textSecondary }]}>...</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.catalogItem,
                  { borderColor: palette.border, backgroundColor: palette.page },
                ]}
              >
                <View style={styles.catalogCopy}>
                  <Text style={[styles.catalogTitle, { color: palette.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.catalogMeta, { color: palette.textSecondary }]}>
                    {item.muscleGroup}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addExerciseButton, { backgroundColor: palette.accent }]}
                  onPress={() => handleAddExercise(item)}
                >
                  <Text style={[styles.addExerciseButtonText, { color: palette.card }]}>
                    {addButtonLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    maxHeight: "80%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  emptyText: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
    paddingVertical: 8,
  },
  paginationHint: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
    textAlign: "center",
    paddingVertical: 10,
  },
  catalogItem: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catalogCopy: {
    flex: 1,
    gap: 4,
  },
  catalogTitle: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  catalogMeta: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  addExerciseButton: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addExerciseButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
