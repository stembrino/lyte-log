import { Checkbox } from "@/components/Checkbox";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { WindowControlButton } from "@/components/WindowControlButton";
import { monoFont } from "@/constants/retroTheme";
import type { LogbookWorkoutItem } from "@/features/logbook/dao/queries/logbookQueries";
import { SelectRoutineModal } from "@/features/workouts/components/SelectRoutineModal";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EditLogbookWorkoutPayload = {
  workoutId: string;
  duration: number | null;
  sourceRoutineId: string | null;
  sets: {
    setId: string;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
};

type EditLogbookWorkoutModalProps = {
  visible: boolean;
  item: LogbookWorkoutItem | null;
  title: string;
  durationLabel: string;
  routineLabel: string;
  noRoutineLabel: string;
  selectRoutineLabel: string;
  setLabel: string;
  repsUnitSuffix: string;
  weightUnit: string;
  completedLabel: string;
  saveLabel: string;
  cancelLabel: string;
  closeButtonAccessibilityLabel: string;
  onClose: () => void;
  onSave: (payload: EditLogbookWorkoutPayload) => Promise<void>;
};

type SetDraft = {
  setId: string;
  exerciseName: string;
  setOrder: number;
  repsDraft: string;
  weightDraft: string;
  completed: boolean;
};

function parseNonNegativeInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function parseNonNegativeFloat(value: string): number {
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function EditLogbookWorkoutModal({
  visible,
  item,
  title,
  durationLabel,
  routineLabel,
  noRoutineLabel,
  selectRoutineLabel,
  setLabel,
  repsUnitSuffix,
  weightUnit,
  completedLabel,
  saveLabel,
  cancelLabel,
  closeButtonAccessibilityLabel,
  onClose,
  onSave,
}: EditLogbookWorkoutModalProps) {
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();
  const [durationDraft, setDurationDraft] = useState("");
  const [setDrafts, setSetDrafts] = useState<SetDraft[]>([]);
  const [routineDraft, setRoutineDraft] = useState<{ id: string; name: string } | null>(null);
  const [selectRoutineOpen, setSelectRoutineOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !item) {
      return;
    }

    setDurationDraft(item.duration !== null ? String(item.duration) : "");
    setRoutineDraft(item.sourceRoutine);
    setSetDrafts(
      item.setDetails.map((setRow) => ({
        setId: setRow.id,
        exerciseName: setRow.exerciseName,
        setOrder: setRow.setOrder,
        repsDraft: String(setRow.reps),
        weightDraft: String(setRow.weight),
        completed: setRow.completed,
      })),
    );
  }, [item, visible]);

  useEffect(() => {
    if (!visible) {
      setSelectRoutineOpen(false);
    }
  }, [visible]);

  const canSave = useMemo(() => Boolean(item) && !saving, [item, saving]);

  const handleSave = async () => {
    if (!item || saving) {
      return;
    }

    const payload: EditLogbookWorkoutPayload = {
      workoutId: item.id,
      duration: durationDraft.trim() ? Math.max(1, parseNonNegativeInt(durationDraft)) : null,
      sourceRoutineId: routineDraft?.id ?? null,
      sets: setDrafts.map((setDraft) => ({
        setId: setDraft.setId,
        reps: parseNonNegativeInt(setDraft.repsDraft),
        weight: parseNonNegativeFloat(setDraft.weightDraft),
        completed: setDraft.completed,
      })),
    };

    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: palette.page }]}>
        <View
          style={[
            styles.header,
            { borderBottomColor: palette.border, paddingTop: Math.max(12, insets.top + 8) },
          ]}
        >
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
          <WindowControlButton
            variant="close"
            size="md"
            onPress={onClose}
            accessibilityLabel={closeButtonAccessibilityLabel}
            disabled={saving}
            borderColor={palette.border}
            backgroundColor={palette.card}
            iconColor={palette.textPrimary}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.fieldCard,
              { borderColor: palette.border, backgroundColor: palette.card },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>{routineLabel}</Text>
            <TouchableOpacity
              style={[
                styles.routineButton,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.page,
                },
              ]}
              onPress={() => setSelectRoutineOpen(true)}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={[styles.routineValueText, { color: palette.textPrimary }]}>
                {routineDraft?.name ?? noRoutineLabel}
              </Text>
              <Text style={[styles.routineActionText, { color: palette.accent }]}>
                {selectRoutineLabel}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.fieldCard,
              { borderColor: palette.border, backgroundColor: palette.card },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>{durationLabel}</Text>
            <TextInput
              style={[
                styles.durationInput,
                {
                  borderColor: palette.border,
                  color: palette.textPrimary,
                  backgroundColor: palette.page,
                },
              ]}
              value={durationDraft}
              onChangeText={setDurationDraft}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {setDrafts.map((setDraft) => (
            <View
              key={setDraft.setId}
              style={[
                styles.fieldCard,
                { borderColor: palette.border, backgroundColor: palette.card },
              ]}
            >
              <Text style={[styles.exerciseTitle, { color: palette.textPrimary }]}>
                {setDraft.exerciseName}
              </Text>
              <Text style={[styles.setMeta, { color: palette.textSecondary }]}>
                {setLabel} {setDraft.setOrder}
              </Text>

              <View style={styles.rowInputs}>
                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>
                    {repsUnitSuffix}
                  </Text>
                  <TextInput
                    style={[
                      styles.numberInput,
                      {
                        borderColor: palette.border,
                        color: palette.textPrimary,
                        backgroundColor: palette.page,
                      },
                    ]}
                    value={setDraft.repsDraft}
                    onChangeText={(value) => {
                      setSetDrafts((prev) =>
                        prev.map((row) =>
                          row.setId === setDraft.setId ? { ...row, repsDraft: value } : row,
                        ),
                      );
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>
                    {weightUnit}
                  </Text>
                  <TextInput
                    style={[
                      styles.numberInput,
                      {
                        borderColor: palette.border,
                        color: palette.textPrimary,
                        backgroundColor: palette.page,
                      },
                    ]}
                    value={setDraft.weightDraft}
                    onChangeText={(value) => {
                      setSetDrafts((prev) =>
                        prev.map((row) =>
                          row.setId === setDraft.setId ? { ...row, weightDraft: value } : row,
                        ),
                      );
                    }}
                    keyboardType="decimal-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <Checkbox
                label={completedLabel}
                checked={setDraft.completed}
                onPress={() => {
                  setSetDrafts((prev) =>
                    prev.map((row) =>
                      row.setId === setDraft.setId ? { ...row, completed: !row.completed } : row,
                    ),
                  );
                }}
                disabled={saving}
              />
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { borderTopColor: palette.border, paddingBottom: Math.max(16, insets.bottom + 8) },
          ]}
        >
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: palette.border }]}
            onPress={onClose}
            disabled={saving}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
              {cancelLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                borderColor: palette.accent,
                backgroundColor: canSave ? palette.accent : palette.border,
              },
            ]}
            onPress={() => {
              void handleSave();
            }}
            disabled={!canSave}
          >
            <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>
              {saving ? "..." : saveLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SelectRoutineModal
        isOpen={selectRoutineOpen}
        onClose={() => setSelectRoutineOpen(false)}
        onSelectRoutine={(routine) => {
          setRoutineDraft({ id: routine.id, name: routine.name });
        }}
        showStartWithoutRoutineAction={false}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  fieldCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  durationInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: monoFont,
    fontSize: 13,
  },
  routineButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  routineValueText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  routineActionText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  exerciseTitle: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  setMeta: {
    fontFamily: monoFont,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 8,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: monoFont,
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  primaryButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
