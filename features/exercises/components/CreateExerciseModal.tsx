import { SingleSelectChipGroup } from "@/components/SingleSelectChipGroup";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export type CreateExercisePayload = {
  name: string;
  muscleGroup: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  muscleGroups: string[];
  onSubmit: (payload: CreateExercisePayload) => Promise<void>;
};

export function CreateExerciseModal({ visible, onClose, muscleGroups, onSubmit }: Props) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [muscleGroupError, setMuscleGroupError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"name" | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName("");
    setMuscleGroup(null);
    setNameError(false);
    setMuscleGroupError(false);
    setSubmitError(null);
    setSubmitting(false);
    setFocusedField(null);
  }, [visible]);

  const resetAndClose = () => {
    setName("");
    setMuscleGroup(null);
    setNameError(false);
    setMuscleGroupError(false);
    setSubmitError(null);
    setSubmitting(false);
    setFocusedField(null);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const selectedMuscleGroup = muscleGroup;
    const hasNameError = trimmedName.length === 0;
    const hasMuscleGroupError = !selectedMuscleGroup;

    setNameError(hasNameError);
    setMuscleGroupError(hasMuscleGroupError);

    if (hasNameError || hasMuscleGroupError) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        muscleGroup: selectedMuscleGroup,
      });
      resetAndClose();
    } catch (error) {
      if (error instanceof Error && error.message === "duplicate_exercise") {
        setSubmitError(t("exercises.alerts.duplicateExerciseMessage"));
        setNameError(true);
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={resetAndClose}
    >
      <View style={[styles.container, { backgroundColor: palette.page }]}>
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <TouchableOpacity onPress={resetAndClose} accessibilityLabel={t("exercises.cancel")}>
            <Text style={[styles.closeButton, { color: palette.textPrimary }]}>X</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
            {t("exercises.createExercise")}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: palette.textSecondary }]}>
            {t("exercises.subtitle")}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t("exercises.exerciseName")}
              <Text style={{ color: palette.accent }}> *</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: nameError ? palette.accent : palette.border,
                  borderWidth: focusedField === "name" ? 2 : 1,
                  color: palette.textPrimary,
                  backgroundColor: palette.card,
                },
              ]}
              placeholder={t("exercises.exerciseName")}
              placeholderTextColor={palette.textSecondary}
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (value.trim()) {
                  setNameError(false);
                }
                setSubmitError(null);
              }}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              maxLength={60}
            />
            {nameError ? (
              <Text style={[styles.errorText, { color: palette.accent }]}>
                {submitError ?? t("exercises.fieldRequired")}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t("exercises.muscleGroup")}
              <Text style={{ color: palette.accent }}> *</Text>
            </Text>
            <SingleSelectChipGroup
              options={muscleGroups}
              selectedOption={muscleGroup}
              onSelect={(groupName) => {
                setMuscleGroup(groupName);
                setMuscleGroupError(false);
              }}
              error={muscleGroupError}
              emptyMessage={t("exercises.noMuscleGroups")}
            />

            {muscleGroupError ? (
              <Text style={[styles.errorText, { color: palette.accent }]}>
                {t("exercises.fieldRequired")}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: palette.border }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: palette.border }]}
            onPress={resetAndClose}
            disabled={submitting}
          >
            <Text style={[styles.buttonText, { color: palette.textPrimary }]}>
              {t("exercises.cancel")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: palette.accent }]}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={submitting}
          >
            <Text style={[styles.buttonText, { color: palette.card }]}>
              {t("exercises.addExercise")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    fontFamily: monoFont,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
    minWidth: 24,
    textAlign: "left",
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  description: {
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    borderRadius: 2,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
  },
  errorText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
  },
  button: {
    minHeight: 44,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  cancelButton: {
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
