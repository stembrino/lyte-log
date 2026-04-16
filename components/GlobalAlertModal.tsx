import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type GlobalAlertAction = {
  label: string;
  onPress?: () => void;
  variant?: "default" | "primary" | "destructive";
};

type GlobalAlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  actions: GlobalAlertAction[];
};

export function GlobalAlertModal({ visible, title, message, actions }: GlobalAlertModalProps) {
  const palette = useRetroPalette();

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} />
        <View
          style={[
            styles.card,
            {
              borderColor: palette.border,
              backgroundColor: palette.card,
            },
          ]}
        >
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: palette.textSecondary }]}>{message}</Text>

          <View style={styles.actionsWrap}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={`${action.label}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={[
                  styles.actionButton,
                  action.variant === "primary"
                    ? {
                        borderColor: palette.accent,
                        backgroundColor: palette.accent,
                      }
                    : action.variant === "destructive"
                      ? {
                          borderColor: palette.accent,
                          backgroundColor: `${palette.accent}1A`,
                        }
                      : {
                          borderColor: palette.border,
                          backgroundColor: palette.page,
                        },
                ]}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.variant === "primary"
                      ? { color: palette.onAccent }
                      : action.variant === "destructive"
                        ? { color: palette.accent }
                        : { color: palette.textPrimary },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  card: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    gap: 10,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  message: {
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  actionsWrap: {
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  actionText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
