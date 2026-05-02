import { AppKeyboardAvoidingView } from "@/components/AppKeyboardAvoidingView";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PostFinishQuickActionsSheetProps = {
  isOpen: boolean;
  showSaveAsRoutine: boolean;
  savingAsRoutine: boolean;
  currentGymName: string | null;
  updatingGym: boolean;
  defaultRoutineName: string;
  onClose: () => void;
  onManageGym: () => void;
  onSaveAsRoutine: (name: string) => void;
  onCopyWorkoutAsText: () => void;
};

export function PostFinishQuickActionsSheet({
  isOpen,
  showSaveAsRoutine,
  savingAsRoutine,
  currentGymName,
  updatingGym,
  defaultRoutineName,
  onClose,
  onManageGym,
  onSaveAsRoutine,
  onCopyWorkoutAsText,
}: PostFinishQuickActionsSheetProps) {
  const palette = useRetroPalette();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();

  const [isNamingRoutine, setIsNamingRoutine] = useState(false);
  const [routineName, setRoutineName] = useState("");

  const handleOpenNaming = () => {
    setRoutineName(defaultRoutineName.toLocaleUpperCase(locale));
    setIsNamingRoutine(true);
  };

  const handleCancelNaming = () => {
    setIsNamingRoutine(false);
    setRoutineName("");
  };

  const handleConfirmSave = () => {
    const trimmed = routineName.trim();
    if (!trimmed) {
      return;
    }
    onSaveAsRoutine(trimmed);
    setIsNamingRoutine(false);
    setRoutineName("");
  };

  const handleClose = () => {
    setIsNamingRoutine(false);
    setRoutineName("");
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <AppKeyboardAvoidingView style={styles.keyboardView} androidBehavior="padding">
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
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t("workouts.postFinishQuickActionsTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {t("workouts.postFinishQuickActionsSubtitle")}
          </Text>

          {showSaveAsRoutine && !isNamingRoutine ? (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: palette.border }]}
              onPress={handleOpenNaming}
              disabled={savingAsRoutine}
            >
              <Text style={[styles.actionButtonText, { color: palette.textPrimary }]}>
                {savingAsRoutine ? t("routines.loading") : t("workouts.postFinishSaveAsRoutineCta")}
              </Text>
            </TouchableOpacity>
          ) : null}

          {!isNamingRoutine ? (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: palette.border }]}
              onPress={onManageGym}
              disabled={updatingGym}
            >
              <Text style={[styles.actionButtonText, { color: palette.textPrimary }]}>
                {updatingGym
                  ? t("routines.loading")
                  : currentGymName
                    ? `${t("workouts.gymFieldLabel")}: ${currentGymName}`
                    : t("workouts.postFinishSelectGymCta")}
              </Text>
            </TouchableOpacity>
          ) : null}

          {isNamingRoutine ? (
            <View style={[styles.namingContainer, { borderColor: palette.border }]}>
              <View style={styles.nameInputRow}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      borderColor: palette.border,
                      color: palette.textPrimary,
                      backgroundColor: palette.page,
                    },
                  ]}
                  value={routineName}
                  onChangeText={(value) => setRoutineName(value.toLocaleUpperCase(locale))}
                  placeholder={t("workouts.postFinishRoutineNamePlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  autoCapitalize="characters"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleConfirmSave}
                />
                {routineName.length > 0 ? (
                  <TouchableOpacity
                    style={styles.nameClearButton}
                    onPress={() => setRoutineName("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <FontAwesome name="times-circle" size={16} color={palette.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.namingActions}>
                <TouchableOpacity
                  style={[styles.namingCancelButton, { borderColor: palette.border }]}
                  onPress={handleCancelNaming}
                >
                  <Text style={[styles.actionButtonText, { color: palette.textSecondary }]}>
                    {t("workouts.postFinishRoutineNameCancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.namingConfirmButton,
                    { backgroundColor: palette.accent, borderColor: palette.accent },
                  ]}
                  onPress={handleConfirmSave}
                  disabled={savingAsRoutine || routineName.trim().length === 0}
                >
                  <Text style={[styles.actionButtonText, { color: palette.onAccent }]}>
                    {savingAsRoutine
                      ? t("routines.loading")
                      : t("workouts.postFinishRoutineNameConfirm")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {!isNamingRoutine ? (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: palette.border }]}
              onPress={onCopyWorkoutAsText}
            >
              <Text style={[styles.actionButtonText, { color: palette.textPrimary }]}>
                {t("workouts.postFinishCopyWorkoutTextCta")}
              </Text>
            </TouchableOpacity>
          ) : null}

          {!isNamingRoutine ? (
            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                { backgroundColor: palette.accent, borderColor: palette.accent },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.primaryActionButtonText, { color: palette.onAccent }]}>
                {t("workouts.postFinishCloseCta")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppKeyboardAvoidingView>
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
  subtitle: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  actionButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontWeight: "700",
  },
  primaryActionButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryActionButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontWeight: "700",
  },
  namingContainer: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    gap: 8,
  },
  nameInputRow: {
    position: "relative",
    justifyContent: "center",
  },
  nameInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingRight: 36,
    fontFamily: monoFont,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  nameClearButton: {
    position: "absolute",
    right: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  namingActions: {
    flexDirection: "row",
    gap: 8,
  },
  namingCancelButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  namingConfirmButton: {
    flex: 2,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
