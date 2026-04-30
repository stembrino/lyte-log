import { useKeyboardAvoiding } from "@/components/hooks/useKeyboardAvoiding";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
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

type CreateRoutineFromWorkoutModalProps = {
  visible: boolean;
  title: string;
  description: string;
  placeholder: string;
  cancelLabel: string;
  confirmLabel: string;
  loadingLabel: string;
  initialName: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
};

export function CreateRoutineFromWorkoutModal({
  visible,
  title,
  description,
  placeholder,
  cancelLabel,
  confirmLabel,
  loadingLabel,
  initialName,
  saving,
  onClose,
  onConfirm,
}: CreateRoutineFromWorkoutModalProps) {
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();
  const keyboardAvoiding = useKeyboardAvoiding({
    iosBehavior: "position",
    iosOffset: -6,
    androidBehavior: "position",
  });
  const [name, setName] = useState("");

  useEffect(() => {
    if (!visible) {
      setName("");
      return;
    }

    setName(initialName);
  }, [initialName, visible]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed || saving) {
      return;
    }

    onConfirm(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        enabled={keyboardAvoiding.enabled}
        behavior={keyboardAvoiding.behavior}
        keyboardVerticalOffset={keyboardAvoiding.keyboardVerticalOffset}
      >
        <View style={styles.backdrop} />

        <View
          style={[
            styles.sheet,
            {
              borderColor: palette.border,
              backgroundColor: palette.card,
              paddingBottom: Math.max(12, insets.bottom + 8),
            },
          ]}
        >
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: palette.textSecondary }]}>{description}</Text>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: palette.border,
                color: palette.textPrimary,
                backgroundColor: palette.page,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={placeholder}
            placeholderTextColor={palette.textSecondary}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: palette.border }]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.textSecondary }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  borderColor: palette.accent,
                  backgroundColor: name.trim().length > 0 ? palette.accent : palette.border,
                },
              ]}
              onPress={handleConfirm}
              disabled={saving || name.trim().length === 0}
            >
              <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>
                {saving ? loadingLabel : confirmLabel}
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
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  sheet: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontWeight: "700",
  },
});
