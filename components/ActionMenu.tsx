import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type ActionMenuItem = {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type ActionMenuProps = {
  actions: ActionMenuItem[];
  accessibilityLabel: string;
  dismissLabel: string;
};

export function ActionMenu({ actions, accessibilityLabel, dismissLabel }: ActionMenuProps) {
  const palette = useRetroPalette();
  const [visible, setVisible] = useState(false);

  const handleActionPress = (action: ActionMenuItem) => {
    setVisible(false);
    action.onPress();
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: palette.border,
            backgroundColor: pressed ? palette.listSelected : palette.card,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <FontAwesome name="ellipsis-h" size={14} color={palette.textPrimary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.scrim} onPress={() => setVisible(false)} />
          <View
            style={[
              styles.panel,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                shadowColor: palette.border,
              },
            ]}
          >
            {actions.map((action, index) => (
              <Pressable
                key={action.key}
                onPress={() => handleActionPress(action)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={({ pressed }) => [
                  styles.actionButton,
                  index > 0 ? { borderTopColor: palette.border, borderTopWidth: 1 } : null,
                  {
                    backgroundColor: pressed ? palette.listSelected : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    { color: action.destructive ? palette.accent : palette.textPrimary },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={dismissLabel}
              style={({ pressed }) => [
                styles.dismissButton,
                {
                  borderColor: palette.border,
                  backgroundColor: pressed ? palette.listSelected : palette.page,
                },
              ]}
            >
              <Text style={[styles.dismissLabel, { color: palette.textSecondary }]}>
                {dismissLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.38)",
  },
  panel: {
    borderTopWidth: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 12,
    gap: 8,
    elevation: 8,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  actionButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dismissButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissLabel: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
