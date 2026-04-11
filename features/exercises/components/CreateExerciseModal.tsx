import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CreateExerciseModal({ visible, onClose }: Props) {
  const { t } = useI18n();
  const palette = useRetroPalette();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View
          style={[styles.sheet, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {t("exercises.createExercise")}
          </Text>
          <Text style={[styles.placeholder, { color: palette.textSecondary }]}>
            {t("exercises.subtitle")}
          </Text>
          <Pressable
            style={[styles.closeButton, { borderColor: palette.border }]}
            onPress={onClose}
            accessibilityLabel={t("exercises.cancel")}
          >
            <Text style={[styles.closeLabel, { color: palette.textPrimary }]}>
              {t("exercises.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopWidth: 1,
    borderRadius: 2,
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  placeholder: {
    fontFamily: monoFont,
    fontSize: 14,
  },
  closeButton: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  closeLabel: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
