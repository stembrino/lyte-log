import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AvatarWithPreview } from "@/components/AvatarWithPreview";
import { Checkbox } from "@/components/Checkbox";
import { ControlledSearchInput } from "@/components/ControlledSearchInput";
import { Snackbar } from "@/components/Snackbar";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import type { AppLocale } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { CreateExerciseModal } from "@/features/exercises/components/CreateExerciseModal";
import { useExerciseMutations } from "@/features/exercises/hooks/useExerciseMutations";
import { useMuscleGroups } from "@/features/exercises/hooks/useMuscleGroups";
import { resolveExerciseImageSource } from "@/features/exercises/utils/exerciseImageSource";
import {
  usePaginatedExerciseLibrary,
  type ExerciseLibraryItem,
} from "@/features/exercises/hooks/usePaginatedExerciseLibrary";
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
  showCreateExerciseButton?: boolean;
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
  showCreateExerciseButton = true,
}: PrepareWorkoutExercisePickerModalProps) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const selectedMuscleGroupValues = selectedMuscleGroup ? [selectedMuscleGroup] : [];

  const { items, hasMore, loadingInitial, loadingMore, loadMore, reload } =
    usePaginatedExerciseLibrary({
      query: searchQuery,
      locale,
      excludeIds: excludeExerciseIds,
      muscleGroups: selectedMuscleGroupValues,
    });
  const { items: muscleGroups } = useMuscleGroups();
  const { createExercise } = useExerciseMutations(reload);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedMuscleGroup(null);
    }
  }, [isOpen]);

  const handleAddExercise = (exercise: ExerciseLibraryItem) => {
    onAddExercise(exercise);
    setSnackbarMessage(t("workouts.exerciseAddedFeedback", { name: exercise.name }));
    setSnackbarVisible(true);
  };

  const handleCreateExercise = async (payload: { name: string; muscleGroup: string }) => {
    await createExercise(payload);
    setCreateModalVisible(false);
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

          <ControlledSearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            variant="compact"
          />

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: palette.textPrimary }]}>
              {t("exercises.muscleGroup")}
            </Text>
            {muscleGroups.length === 0 ? (
              <Text style={[styles.emptyFilterText, { color: palette.textSecondary }]}>
                {t("exercises.noMuscleGroups")}
              </Text>
            ) : (
              <View style={styles.filterList}>
                {muscleGroups.map((groupName) => (
                  <View key={groupName} style={styles.filterItem}>
                    <Checkbox
                      label={groupName}
                      checked={selectedMuscleGroup === groupName}
                      onPress={() => {
                        setSelectedMuscleGroup((prev) => (prev === groupName ? null : groupName));
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {showCreateExerciseButton ? (
            <TouchableOpacity
              style={[styles.createExerciseButton, { borderColor: palette.border }]}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={[styles.createExerciseButtonText, { color: palette.textPrimary }]}>
                + {t("exercises.createExercise")}
              </Text>
            </TouchableOpacity>
          ) : null}

          <FlatList
            style={styles.exerciseList}
            contentContainerStyle={styles.exerciseListContent}
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
            renderItem={({ item }) => {
              const imageSource = resolveExerciseImageSource(item.id, item.imageUrl);

              return (
                <View
                  style={[
                    styles.catalogItem,
                    { borderColor: palette.border, backgroundColor: palette.page },
                  ]}
                >
                  <AvatarWithPreview
                    label={item.name}
                    size="lg"
                    imageSource={imageSource}
                    previewTitle={item.name}
                  />
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
                    <Text style={[styles.addExerciseButtonText, { color: palette.onAccent }]}>
                      {addButtonLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </View>

      <CreateExerciseModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        muscleGroups={muscleGroups}
        onSubmit={handleCreateExercise}
      />

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
        position="top"
        align="end"
      />
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
    height: "80%",
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
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterItem: {
    width: "23.5%",
  },
  emptyFilterText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  createExerciseButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  createExerciseButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
  exerciseList: {
    flex: 1,
    minHeight: 0,
  },
  exerciseListContent: {
    flexGrow: 1,
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
