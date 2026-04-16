import FontAwesome from "@expo/vector-icons/FontAwesome";
import { monoFont } from "@/constants/retroTheme";
import type { ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type ControlledInfoHintProps = {
  visible: boolean;
  onVisibleChange: (nextVisible: boolean) => void;
  message: string;
  dismissLabel: string;
  triggerAccessibilityLabel: string;
  tintColor: string;
  cardBackgroundColor: string;
  borderColor: string;
  textColor: string;
  iconName?: ComponentProps<typeof FontAwesome>["name"];
};

export function ControlledInfoHint({
  visible,
  onVisibleChange,
  message,
  dismissLabel,
  triggerAccessibilityLabel,
  tintColor,
  cardBackgroundColor,
  borderColor,
  textColor,
  iconName,
}: ControlledInfoHintProps) {
  return (
    <>
      <Pressable
        onPress={() => onVisibleChange(true)}
        accessibilityRole="button"
        accessibilityLabel={triggerAccessibilityLabel}
        hitSlop={8}
        style={[styles.trigger, { borderColor: tintColor, backgroundColor: tintColor }]}
      >
        {iconName ? (
          <FontAwesome name={iconName} size={11} color={cardBackgroundColor} />
        ) : (
          <Text style={[styles.triggerText, { color: cardBackgroundColor }]}>?</Text>
        )}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => onVisibleChange(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.scrim} onPress={() => onVisibleChange(false)} />
          <View
            style={[
              styles.card,
              { backgroundColor: cardBackgroundColor, borderColor, shadowColor: borderColor },
            ]}
          >
            <Text style={[styles.message, { color: textColor }]}>{message}</Text>
            <Pressable
              onPress={() => onVisibleChange(false)}
              style={[styles.dismissButton, { borderColor, backgroundColor: cardBackgroundColor }]}
              accessibilityRole="button"
              accessibilityLabel={dismissLabel}
            >
              <Text style={[styles.dismissText, { color: tintColor }]}>{dismissLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  card: {
    width: "100%",
    maxWidth: 288,
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    gap: 8,
    elevation: 6,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  message: {
    fontFamily: monoFont,
    fontSize: 11,
    lineHeight: 16,
  },
  dismissButton: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  dismissText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
