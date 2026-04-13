import { monoFont } from "@/constants/retroTheme";
import type { AppLocale } from "@/constants/translations";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type EditableWorkoutExercise = {
  id: string;
  name: string;
  exerciseOrder: number;
  setsTarget: string;
  repsTarget: string;
};

type PrepareWorkoutExercisesFormProps = {
  items: EditableWorkoutExercise[];
  locale: AppLocale;
  reorderHint: string;
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
};

export function PrepareWorkoutExercisesForm({
  items,
  locale,
  reorderHint,
  palette,
  onReorder,
}: PrepareWorkoutExercisesFormProps) {
  const renderItem = ({ item, drag, isActive }: RenderItemParams<EditableWorkoutExercise>) => {
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.exerciseRow,
            {
              borderColor: palette.border,
              backgroundColor: isActive ? palette.listSelected : palette.card,
            },
          ]}
        >
          <Pressable onLongPress={drag} delayLongPress={120} style={styles.dragHandle}>
            <Text style={[styles.dragHandleText, { color: palette.textSecondary }]}>::</Text>
          </Pressable>

          <Text style={[styles.exerciseOrder, { color: palette.accent }]}>
            {item.exerciseOrder}.
          </Text>

          <View style={styles.exerciseCopy}>
            <Text style={[styles.exerciseName, { color: palette.textPrimary }]}>{item.name}</Text>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: palette.textSecondary }]}>
        {reorderHint}
        {locale === "pt-BR" ? " (segure e arraste)" : " (long press and drag)"}
      </Text>
      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => onReorder(data)}
        activationDistance={12}
        removeClippedSubviews={false}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.listContent}
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
  hint: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
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
    alignItems: "center",
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
    width: 20,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  exerciseCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
