import { AppKeyboardAvoidingView } from "@/components/AppKeyboardAvoidingView";
import { Chip } from "@/components/Chip";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { WindowControlButton } from "@/components/WindowControlButton";
import { monoFont } from "@/constants/retroTheme";
import type { GymItem } from "@/features/workouts/dao/queries/gymQueries";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SelectGymModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gyms: GymItem[];
  selectedGymId: string | null;
  loading: boolean;
  title: string;
  noneLabel: string;
  addPlaceholder: string;
  addButtonLabel: string;
  emptyLabel: string;
  onSelectGym: (gymId: string | null) => void;
  onAddGym: (name: string) => Promise<boolean | void>;
  onDeleteGym?: (gymId: string) => void;
  deleteGymButtonAccessibilityLabel?: string;
};

export function SelectGymModal({
  isOpen,
  onClose,
  gyms,
  selectedGymId,
  loading,
  title,
  noneLabel,
  addPlaceholder,
  addButtonLabel,
  emptyLabel,
  onSelectGym,
  onAddGym,
  onDeleteGym,
  deleteGymButtonAccessibilityLabel,
}: SelectGymModalProps) {
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();

  const [draftGymName, setDraftGymName] = useState("");

  const handleAdd = async () => {
    const trimmed = draftGymName.trim();
    if (!trimmed) {
      return;
    }

    const shouldClear = await onAddGym(trimmed);

    if (shouldClear !== false) {
      setDraftGymName("");
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <AppKeyboardAvoidingView iosOffset={-6} androidBehavior="position">
        <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: palette.card,
                paddingBottom: 20 + insets.bottom,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
              <WindowControlButton
                variant="close"
                size="md"
                onPress={onClose}
                accessibilityLabel="Close gym selector"
                borderColor={palette.border}
                backgroundColor={palette.page}
                iconColor={palette.textPrimary}
              />
            </View>

            <View style={styles.addRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: palette.border,
                    color: palette.textPrimary,
                    backgroundColor: palette.page,
                  },
                ]}
                value={draftGymName}
                onChangeText={setDraftGymName}
                placeholder={addPlaceholder}
                placeholderTextColor={palette.textSecondary}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => {
                  void handleAdd();
                }}
              />
              <TouchableOpacity
                style={[styles.addButton, { borderColor: palette.border }]}
                onPress={() => {
                  void handleAdd();
                }}
              >
                <Text style={[styles.addButtonText, { color: palette.textPrimary }]}>
                  {addButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={[styles.chipsWrap, { paddingBottom: 12 + insets.bottom }]}
              keyboardShouldPersistTaps="handled"
            >
              <Chip
                label={noneLabel}
                selected={selectedGymId === null}
                onPress={() => onSelectGym(null)}
              />

              {gyms.map((gym) => {
                const selected = selectedGymId === gym.id;
                return (
                  <View
                    key={gym.id}
                    style={[
                      styles.gymChip,
                      {
                        borderColor: selected ? palette.accent : palette.border,
                        backgroundColor: selected ? palette.accent : palette.card,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.gymChipMainButton}
                      onPress={() => onSelectGym(gym.id)}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.gymChipText,
                          { color: selected ? palette.onAccent : palette.textPrimary },
                        ]}
                      >
                        {selected ? "[x] " : "[ ] "}
                        {gym.name}
                      </Text>
                    </TouchableOpacity>

                    {onDeleteGym ? (
                      <TouchableOpacity
                        style={[
                          styles.deleteGymButton,
                          {
                            borderLeftColor: selected ? palette.onAccent : palette.border,
                          },
                        ]}
                        onPress={() => onDeleteGym(gym.id)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          deleteGymButtonAccessibilityLabel
                            ? `${deleteGymButtonAccessibilityLabel}: ${gym.name}`
                            : undefined
                        }
                        hitSlop={8}
                      >
                        <FontAwesome
                          name="trash"
                          size={12}
                          color={selected ? palette.onAccent : palette.textSecondary}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              {!loading && gyms.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
                  {emptyLabel}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </AppKeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: "72%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  addRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 40,
    paddingHorizontal: 10,
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  addButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gymItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gymChip: {
    borderWidth: 1,
    borderRadius: 2,
    minHeight: 36,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  gymChipMainButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  gymChipText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  deleteGymButton: {
    minWidth: 28,
    minHeight: 28,
    borderLeftWidth: 1,
    marginRight: 4,
    opacity: 0.75,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    width: "100%",
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
