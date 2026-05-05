import { AppKeyboardAvoidingView } from "@/components/AppKeyboardAvoidingView";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { WindowControlButton } from "@/components/WindowControlButton";
import { monoFont } from "@/constants/retroTheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InProgressAdjustItem = {
  id: string;
  name: string;
  exerciseOrder: number;
};

type InProgressAdjustSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  items: InProgressAdjustItem[];
  title: string;
  reorderHint: string;
  manageGymLabel: string;
  manageGymAccessibilityLabel: string;
  doneLabel: string;
  onManageGym: () => void;
  onReorder: (nextItemIds: string[]) => void;
};

export function InProgressAdjustSheet({
  isOpen,
  onClose,
  items,
  title,
  reorderHint,
  manageGymLabel,
  manageGymAccessibilityLabel,
  doneLabel,
  onManageGym,
  onReorder,
}: InProgressAdjustSheetProps) {
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();
  const [draftItems, setDraftItems] = useState<InProgressAdjustItem[]>(items);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftItems(
      items
        .slice()
        .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
        .map((item, index) => ({
          ...item,
          exerciseOrder: index + 1,
        })),
    );
  }, [isOpen, items]);

  const handleApply = () => {
    onReorder(draftItems.map((item) => item.id));
    onClose();
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<InProgressAdjustItem>) => {
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          style={[
            styles.row,
            {
              borderColor: palette.border,
              backgroundColor: isActive ? palette.listSelected : palette.card,
            },
          ]}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.orderText, { color: palette.accent }]}>{item.exerciseOrder}.</Text>
            <Text style={[styles.nameText, { color: palette.textPrimary }]}>{item.name}</Text>
          </View>

          <Pressable
            onPressIn={drag}
            hitSlop={8}
            style={styles.dragHandle}
            accessibilityRole="button"
          >
            <FontAwesome name="bars" size={14} color={palette.textSecondary} />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <AppKeyboardAvoidingView style={styles.keyboardView} androidBehavior="padding">
          <View style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.22)" }]} />

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
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
              </View>
              <WindowControlButton
                variant="close"
                size="md"
                onPress={onClose}
                accessibilityLabel={doneLabel}
                borderColor={palette.border}
                backgroundColor={palette.page}
                iconColor={palette.textPrimary}
              />
            </View>

            <Text style={[styles.hint, { color: palette.textSecondary }]}>{reorderHint}</Text>

            <View style={[styles.listContainer, { borderColor: palette.border }]}>
              <DraggableFlatList
                data={draftItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({ data }) => {
                  setDraftItems(
                    data.map((item, index) => ({
                      ...item,
                      exerciseOrder: index + 1,
                    })),
                  );
                }}
                activationDistance={2}
                autoscrollThreshold={40}
                autoscrollSpeed={120}
                dragItemOverflow
                removeClippedSubviews={false}
                containerStyle={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
              />
            </View>

            <TouchableOpacity
              style={[styles.secondaryAction, { borderColor: palette.border }]}
              onPress={onManageGym}
              accessibilityRole="button"
              accessibilityLabel={manageGymAccessibilityLabel}
            >
              <Text style={[styles.secondaryActionText, { color: palette.textPrimary }]}>
                {manageGymLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryAction,
                {
                  backgroundColor: palette.accent,
                  borderColor: palette.accent,
                },
              ]}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel={doneLabel}
            >
              <Text style={[styles.primaryActionText, { color: palette.onAccent }]}>
                {doneLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </AppKeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "82%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hint: {
    fontFamily: monoFont,
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  listContainer: {
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 120,
    maxHeight: 340,
  },
  list: {
    minHeight: 120,
    maxHeight: 340,
  },
  listContent: {
    padding: 8,
    paddingBottom: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 10,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  orderText: {
    width: 26,
    textAlign: "right",
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  nameText: {
    flex: 1,
    minWidth: 0,
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dragHandle: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryAction: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  primaryAction: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryActionText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
