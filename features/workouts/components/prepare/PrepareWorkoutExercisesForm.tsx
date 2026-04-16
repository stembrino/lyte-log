import { AvatarWithPreview } from "@/components/AvatarWithPreview";
import { RoundAddButton } from "@/components/RoundAddButton";
import { monoFont } from "@/constants/retroTheme";
import { resolveExerciseImageSource } from "@/features/exercises/utils/exerciseImageSource";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export type EditableWorkoutExercise = {
  id: string;
  exerciseId?: string;
  name: string;
  exerciseOrder: number;
  setsTarget: string;
  repsTarget: string;
};

type PrepareWorkoutExercisesFormProps = {
  items: EditableWorkoutExercise[];
  addButtonAccessibilityLabel: string;
  removeButtonLabel: string;
  setsPlaceholder: string;
  repsPlaceholder: string;
  palette: {
    card: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    page: string;
    listSelected: string;
  };
  onReorder: (nextItems: EditableWorkoutExercise[]) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExerciseField: (id: string, field: "setsTarget" | "repsTarget", value: string) => void;
  onPressAddExercise: () => void;
};

export function PrepareWorkoutExercisesForm({
  items,
  addButtonAccessibilityLabel,
  removeButtonLabel,
  setsPlaceholder,
  repsPlaceholder,
  palette,
  onReorder,
  onRemoveExercise,
  onUpdateExerciseField,
  onPressAddExercise,
}: PrepareWorkoutExercisesFormProps) {
  const renderItem = ({ item, drag, isActive }: RenderItemParams<EditableWorkoutExercise>) => {
    const imageSource = resolveExerciseImageSource(item.exerciseId ?? item.id, null);

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          style={[
            styles.exerciseRow,
            {
              borderColor: palette.border,
              backgroundColor: isActive ? palette.listSelected : palette.card,
            },
          ]}
        >
          <View style={styles.dragHandle}>
            <Text style={[styles.dragHandleText, { color: palette.textSecondary }]}>::</Text>
          </View>

          <AvatarWithPreview
            label={item.name}
            size="md"
            imageSource={imageSource}
            previewTitle={item.name}
          />

          <Text style={[styles.exerciseOrder, { color: palette.accent }]}>
            {item.exerciseOrder}.
          </Text>

          <View style={styles.exerciseCopy}>
            <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>{item.name}</Text>
            <View style={styles.fieldsRow}>
              <TextInput
                style={[
                  styles.smallInput,
                  {
                    borderColor: palette.border,
                    color: palette.textPrimary,
                    backgroundColor: palette.page,
                  },
                ]}
                value={item.setsTarget}
                onChangeText={(value) => onUpdateExerciseField(item.id, "setsTarget", value)}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
                {setsPlaceholder.toLowerCase()}
              </Text>
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>de</Text>
              <TextInput
                style={[
                  styles.smallInput,
                  {
                    borderColor: palette.border,
                    color: palette.textPrimary,
                    backgroundColor: palette.page,
                  },
                ]}
                value={item.repsTarget}
                onChangeText={(value) => onUpdateExerciseField(item.id, "repsTarget", value)}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
                {repsPlaceholder.toLowerCase()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveExercise(item.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={removeButtonLabel}
          >
            <FontAwesome name="times" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => onReorder(data)}
        activationDistance={12}
        removeClippedSubviews={false}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.addFooter}>
            <RoundAddButton
              size="small"
              accessibilityLabel={addButtonAccessibilityLabel}
              onPress={onPressAddExercise}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    gap: 8,
  },
  listContainer: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 6,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  dragHandle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleText: {
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  exerciseOrder: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    width: 24,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  exerciseCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  exerciseName: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  fieldsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 6,
    rowGap: 6,
    alignItems: "center",
  },
  smallInput: {
    width: 32,
    height: 36,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  fieldLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "lowercase",
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  addFooter: {
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: "center",
  },
});
