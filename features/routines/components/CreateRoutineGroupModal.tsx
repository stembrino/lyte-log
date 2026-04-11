import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RequiredFieldsNotice } from "./RequiredFieldsNotice";

type RoutineOption = {
  id: string;
  name: string;
  detail: string | null;
};

type CreateRoutineGroupPayload = {
  name: string;
  detail?: string;
  description?: string;
  routineIds: string[];
};

type CreateRoutineGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  routines: RoutineOption[];
  onSubmit: (payload: CreateRoutineGroupPayload) => Promise<void>;
};

export function CreateRoutineGroupModal({
  visible,
  onClose,
  routines,
  onSubmit,
}: CreateRoutineGroupModalProps) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showRequiredValidation, setShowRequiredValidation] = useState(false);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && selectedRoutineIds.size > 0 && !submitting,
    [name, selectedRoutineIds, submitting],
  );

  const missingRequiredFields = useMemo(() => {
    const missing: string[] = [];

    if (!name.trim()) {
      missing.push(t("routines.groupFormMissingName"));
    }

    if (selectedRoutineIds.size === 0) {
      missing.push(t("routines.groupFormMissingRoutines"));
    }

    return missing;
  }, [name, selectedRoutineIds, t]);

  const handleToggleRoutine = (routineId: string) => {
    setSelectedRoutineIds((prev) => {
      const next = new Set(prev);
      if (next.has(routineId)) {
        next.delete(routineId);
      } else {
        next.add(routineId);
      }
      return next;
    });
  };

  const resetAndClose = () => {
    setName("");
    setDetail("");
    setDescription("");
    setSelectedRoutineIds(new Set());
    setSubmitting(false);
    setShowRequiredValidation(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setShowRequiredValidation(true);
      return;
    }

    setShowRequiredValidation(false);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        detail: detail.trim() || undefined,
        description: description.trim() || undefined,
        routineIds: Array.from(selectedRoutineIds),
      });
      resetAndClose();
    } catch {
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
          <TouchableOpacity onPress={resetAndClose}>
            <Text style={[styles.closeButton, { color: palette.textPrimary }]}>✕</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
            {t("routines.createGroup")}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t("routines.groupFormNameLabel")}
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
              placeholder={t("routines.groupFormNamePlaceholder")}
              placeholderTextColor={palette.textSecondary}
              value={name}
              onChangeText={(value) => {
                setName(value);
              }}
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t("routines.groupFormDetailLabel")}
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
              placeholder={t("routines.groupFormDetailPlaceholder")}
              placeholderTextColor={palette.textSecondary}
              value={detail}
              onChangeText={setDetail}
              maxLength={60}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t("routines.groupFormDescriptionLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                {
                  borderColor: palette.border,
                  color: palette.textPrimary,
                  backgroundColor: palette.card,
                },
              ]}
              placeholder={t("routines.groupFormDescriptionPlaceholder")}
              placeholderTextColor={palette.textSecondary}
              value={description}
              onChangeText={setDescription}
              maxLength={280}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>
              {t("routines.groupFormAttachRoutinesLabel")}
            </Text>
            <View style={styles.routinesList}>
              {routines.map((routine) => {
                const selected = selectedRoutineIds.has(routine.id);

                return (
                  <Pressable
                    key={routine.id}
                    onPress={() => handleToggleRoutine(routine.id)}
                    style={[
                      styles.routineRow,
                      {
                        borderColor: selected ? palette.accent : palette.border,
                        backgroundColor: selected ? palette.accent : palette.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.routineName,
                        { color: selected ? palette.card : palette.textPrimary },
                      ]}
                    >
                      {routine.name}
                    </Text>
                    {routine.detail ? (
                      <Text
                        style={[
                          styles.routineDetail,
                          { color: selected ? palette.card : palette.textSecondary },
                        ]}
                      >
                        {routine.detail}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {showRequiredValidation ? (
            <RequiredFieldsNotice
              title={t("routines.groupFormValidationTitle")}
              fields={missingRequiredFields}
              borderColor={palette.accent}
              backgroundColor={palette.card}
              titleColor={palette.accent}
              textColor={palette.textPrimary}
            />
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: palette.border }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: palette.border }]}
            onPress={resetAndClose}
            disabled={submitting}
          >
            <Text style={[styles.buttonText, { color: palette.textPrimary }]}>
              {t("routines.cancelButton")}
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
              {t("routines.createGroup")}
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
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  headerSpacer: {
    width: 40,
  },
  closeButton: {
    fontSize: 24,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 16,
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
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
  },
  routinesList: {
    gap: 8,
  },
  routineRow: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  routineName: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  routineDetail: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  button: {
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  primaryButton: {
    flex: 1,
  },
  buttonText: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
