import { Chip } from "@/components/Chip";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import type { GymItem } from "@/features/workouts/dao/queries/gymQueries";
import { useState } from "react";
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
}: SelectGymModalProps) {
  const palette = useRetroPalette();
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
      <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
        <View style={[styles.container, { backgroundColor: palette.card }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.closeButton, { color: palette.textPrimary }]}>✕</Text>
            </Pressable>
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

          <ScrollView contentContainerStyle={styles.chipsWrap} keyboardShouldPersistTaps="handled">
            <Chip
              label={noneLabel}
              selected={selectedGymId === null}
              onPress={() => onSelectGym(null)}
            />

            {gyms.map((gym) => (
              <Chip
                key={gym.id}
                label={gym.name}
                selected={selectedGymId === gym.id}
                onPress={() => onSelectGym(gym.id)}
              />
            ))}

            {!loading && gyms.length === 0 ? (
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{emptyLabel}</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
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
    paddingBottom: 20,
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
  closeButton: {
    fontSize: 24,
    fontWeight: "700",
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
    paddingBottom: 12,
  },
  emptyText: {
    width: "100%",
    fontFamily: monoFont,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
