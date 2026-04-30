import { SingleSelectChipGroup } from "@/components/SingleSelectChipGroup";
import { WindowControlButton } from "@/components/WindowControlButton";
import { useKeyboardAvoiding } from "@/components/hooks/useKeyboardAvoiding";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CreateExercisePayload = {
  name: string;
  muscleGroup: string;
};

type ExerciseModalMode = "create" | "edit";

type Props = {
  visible: boolean;
  onClose: () => void;
  muscleGroups: string[];
  onSubmit: (payload: CreateExercisePayload) => Promise<void>;
  mode?: ExerciseModalMode;
  initialValues?: CreateExercisePayload;
};

export function CreateExerciseModal({
  visible,
  onClose,
  muscleGroups,
  onSubmit,
  mode = "create",
  initialValues,
}: Props) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();
  const keyboardAvoiding = useKeyboardAvoiding();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [muscleGroupError, setMuscleGroupError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"name" | null>(null);
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(initialValues?.name?.toUpperCase() ?? "");
    setMuscleGroup(initialValues?.muscleGroup ?? null);
    setNameError(false);
    setMuscleGroupError(false);
    setSubmitError(null);
    setSubmitting(false);
    setFocusedField(null);
  }, [initialValues, visible]);

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
    const trimmedName = name.trim().toUpperCase();
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        enabled={keyboardAvoiding.enabled}
        behavior={keyboardAvoiding.behavior}
        keyboardVerticalOffset={keyboardAvoiding.keyboardVerticalOffset}
      >
        <View style={[styles.container, { backgroundColor: palette.page }]}>
          <View
            style={[
              styles.header,
              { borderBottomColor: palette.border, paddingTop: Math.max(12, insets.top + 8) },
            ]}
          >
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
              {isEditMode ? t("exercises.editExercise") : t("exercises.createExercise")}
            </Text>

            <WindowControlButton
              variant="close"
              size="md"
              onPress={resetAndClose}
              accessibilityLabel={t("exercises.cancel")}
              borderColor={palette.border}
              backgroundColor={palette.card}
              iconColor={palette.textPrimary}
            />
          </View>

          <View style={styles.content}>
            <Text style={[styles.description, { color: palette.textSecondary }]}>
              {isEditMode ? t("exercises.editExerciseHint") : t("exercises.subtitle")}
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
                  const uppercasedValue = value.toUpperCase();
                  setName(uppercasedValue);
                  if (uppercasedValue.trim()) {
                    setNameError(false);
                  }
                  setSubmitError(null);
                }}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="characters"
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

          <View
            style={[
              styles.footer,
              { borderTopColor: palette.border, paddingBottom: Math.max(16, insets.bottom + 8) },
            ]}
          >
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
              <Text style={[styles.buttonText, { color: palette.onAccent }]}>
                {isEditMode ? t("exercises.saveExercise") : t("exercises.addExercise")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
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
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
