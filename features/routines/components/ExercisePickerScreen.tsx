import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import type { ExerciseLibraryItem } from "@/features/routines/hooks/usePaginatedExerciseLibrary";
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
  getExerciseLabel: (e: { i18nKey: string | null; name: string }) => string;
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
  return (
    <View style={styles.exercisesScreen}>
      <Text style={[styles.screenHint, { color: palette.textSecondary }]}>
        {t("routines.addExercisesHint")}
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            borderColor: palette.border,
            color: palette.textPrimary,
            backgroundColor: palette.card,
          },
        ]}
        placeholder={t("routines.searchExercisePlaceholder")}
        placeholderTextColor={palette.textSecondary}
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
      />

      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        {t("routines.selectedExercisesTitle")}
      </Text>

      {selectedExercises.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
          {t("routines.selectedExercisesEmpty")}
        </Text>
      ) : (
        <View style={styles.selectedList}>
          {selectedExercises.map((exercise) => (
            <View
              key={exercise.exerciseId}
              style={[
                styles.selectedCard,
                { borderColor: palette.border, backgroundColor: palette.card },
              ]}
            >
              <View style={styles.selectedHeaderRow}>
                <Text style={[styles.selectedExerciseTitle, { color: palette.textPrimary }]}>
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
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      borderColor: palette.border,
                      color: palette.textPrimary,
                      backgroundColor: palette.page,
                    },
                  ]}
                  placeholder={t("routines.setsPlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  value={exercise.setsTarget}
                  onChangeText={(value) =>
                    onUpdateExerciseField(exercise.exerciseId, "setsTarget", value)
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      borderColor: palette.border,
                      color: palette.textPrimary,
                      backgroundColor: palette.page,
                    },
                  ]}
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
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        {t("routines.availableExercisesTitle")}
      </Text>

      <FlatList
        data={pagedExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.catalogList}
        keyboardShouldPersistTaps="handled"
        onEndReached={onLoadMoreExercises}
        onEndReachedThreshold={0.4}
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
              <Text style={[styles.addExerciseButtonText, { color: palette.card }]}>
                {t("routines.addExerciseButton")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  exercisesScreen: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  screenHint: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
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
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
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
