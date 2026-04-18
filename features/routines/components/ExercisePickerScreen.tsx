import { ControlledSearchInput } from "@/components/ControlledSearchInput";
import { AvatarWithPreview } from "@/components/AvatarWithPreview";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import type { ExerciseLibraryItem } from "@/features/exercises/hooks/usePaginatedExerciseLibrary";
import { resolveExerciseImageSource } from "@/features/exercises/utils/exerciseImageSource";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { SelectedRoutineExercise } from "./types";

type Palette = ReturnType<typeof useRetroPalette>;
type TFn = ReturnType<typeof useI18n>["t"];

export type ExercisePickerScreenProps = {
  searchQuery: string;
  onChangeSearchQuery: (v: string) => void;
  selectedExercises: SelectedRoutineExercise[];
  onRemoveExercise: (id: string) => void;
  onUpdateExerciseField: (id: string, field: "setsTarget" | "repsTarget", value: string) => void;
  getExerciseLabel: (e: { name: string }) => string;
  pagedExercises: ExerciseLibraryItem[];
  hasMoreExercises: boolean;
  loadingInitialExercises: boolean;
  loadingMoreExercises: boolean;
  onLoadMoreExercises: () => void;
  onAddExercise: (e: ExerciseLibraryItem) => void;
  palette: Palette;
  t: TFn;
};

export function ExercisePickerScreen({
  searchQuery,
  onChangeSearchQuery,
  selectedExercises,
  onRemoveExercise,
  onUpdateExerciseField,
  getExerciseLabel,
  pagedExercises,
  hasMoreExercises,
  loadingInitialExercises,
  loadingMoreExercises,
  onLoadMoreExercises,
  onAddExercise,
  palette,
  t,
}: ExercisePickerScreenProps) {
  const selectedExercisesList = useMemo(
    () =>
      (Array.isArray(selectedExercises) ? selectedExercises : []).filter(
        (exercise): exercise is SelectedRoutineExercise =>
          Boolean(exercise?.exerciseId && exercise?.name),
      ),
    [selectedExercises],
  );

  return (
    <FlatList
      data={pagedExercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.exercisesContent}
      keyboardShouldPersistTaps="handled"
      onEndReached={onLoadMoreExercises}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View style={styles.headerContent}>
          <Text style={[styles.screenHint, { color: palette.textSecondary }]}>
            {t("routines.addExercisesHint")}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            {t("routines.selectedExercisesTitle")}
          </Text>

          {selectedExercisesList.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
              {t("routines.selectedExercisesEmpty")}
            </Text>
          ) : (
            <View style={[styles.selectedList, { borderColor: palette.border }]}>
              {selectedExercisesList.map((exercise, index) => (
                <View
                  key={`${exercise.exerciseId}-${exercise.exerciseOrder}-${index}`}
                  style={[
                    styles.selectedCard,
                    { borderColor: palette.border, backgroundColor: palette.card },
                  ]}
                >
                  <View style={styles.selectedHeaderRow}>
                    <Text style={[styles.selectedExerciseTitle, { color: palette.accent }]}>
                      {exercise.exerciseOrder}. {getExerciseLabel(exercise)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onRemoveExercise(exercise.exerciseId)}
                      style={[styles.removeButton, { borderColor: palette.border }]}
                    >
                      <Text style={[styles.removeButtonText, { color: palette.textPrimary }]}>
                        {t("routines.removeExerciseButton")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.selectedFieldsRow}>
                    <View
                      style={[
                        styles.smallInputWrapper,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.page,
                        },
                      ]}
                    >
                      <Text style={[styles.inputPrefix, { color: palette.textSecondary }]}>
                        {t("routines.setsInputPrefix")}
                      </Text>
                      <TextInput
                        style={[styles.smallInput, { color: palette.textPrimary }]}
                        placeholder={t("routines.setsPlaceholder")}
                        placeholderTextColor={palette.textSecondary}
                        value={exercise.setsTarget}
                        onChangeText={(value) =>
                          onUpdateExerciseField(exercise.exerciseId, "setsTarget", value)
                        }
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                    <View
                      style={[
                        styles.smallInputWrapper,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.page,
                        },
                      ]}
                    >
                      <Text style={[styles.inputPrefix, { color: palette.textSecondary }]}>
                        {t("routines.repsInputPrefix")}
                      </Text>
                      <TextInput
                        style={[styles.smallInput, { color: palette.textPrimary }]}
                        placeholder={t("routines.repsPlaceholder")}
                        placeholderTextColor={palette.textSecondary}
                        value={exercise.repsTarget}
                        onChangeText={(value) =>
                          onUpdateExerciseField(exercise.exerciseId, "repsTarget", value)
                        }
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            {t("routines.availableExercisesTitle")}
          </Text>

          <ControlledSearchInput
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            placeholder={t("routines.searchExercisePlaceholder")}
            variant="compact"
          />
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
          {loadingInitialExercises ? t("routines.loading") : t("routines.noExerciseResults")}
        </Text>
      }
      ListFooterComponent={
        loadingMoreExercises ? (
          <Text style={[styles.paginationHint, { color: palette.textSecondary }]}>
            {t("routines.loading")}
          </Text>
        ) : hasMoreExercises ? (
          <Text style={[styles.paginationHint, { color: palette.textSecondary }]}>...</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.catalogItem,
            { borderColor: palette.border, backgroundColor: palette.card },
          ]}
        >
          <AvatarWithPreview
            label={getExerciseLabel(item)}
            size="lg"
            imageSource={resolveExerciseImageSource(item.id, item.imageUrl ?? null)}
            previewTitle={getExerciseLabel(item)}
          />
          <View style={styles.catalogCopy}>
            <Text style={[styles.catalogTitle, { color: palette.textPrimary }]}>
              {getExerciseLabel(item)}
            </Text>
            <Text style={[styles.catalogMeta, { color: palette.textSecondary }]}>
              {item.muscleGroup}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addExerciseButton, { backgroundColor: palette.accent }]}
            onPress={() => onAddExercise(item)}
          >
            <Text style={[styles.addExerciseButtonText, { color: palette.onAccent }]}>
              {t("routines.addExerciseButton")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  exercisesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerContent: {
    gap: 12,
    paddingBottom: 8,
  },
  screenHint: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    marginTop: 4,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  emptyText: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
  },
  selectedList: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    gap: 8,
  },
  selectedCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    gap: 10,
  },
  selectedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectedExerciseTitle: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  selectedFieldsRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 6,
  },
  inputPrefix: {
    fontFamily: monoFont,
    fontSize: 12,
    textTransform: "lowercase",
    marginRight: 6,
  },
  smallInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontFamily: monoFont,
    fontSize: 13,
  },
  removeButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  catalogList: {
    gap: 8,
    paddingBottom: 8,
  },
  paginationHint: {
    paddingVertical: 6,
    textAlign: "center",
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  catalogItem: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catalogCopy: {
    flex: 1,
    gap: 2,
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
