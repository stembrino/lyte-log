import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import type { WorkoutRoutinePickerItem } from "@/features/workouts/hooks/useRoutinePicker";
import { useRoutinePicker } from "@/features/workouts/hooks/useRoutinePicker";
import { monoFont } from "@/constants/retroTheme";
import { ControlledSearchInput } from "@/components/ControlledSearchInput";
import { WindowControlButton } from "@/components/WindowControlButton";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoutinePickerList } from "./routine-picker/RoutinePickerList";

interface SelectRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoutine?: (routine: WorkoutRoutinePickerItem) => void;
  onSelectRoutineId?: (routineId: string) => void;
  onStartWithoutRoutine?: () => void;
  showStartWithoutRoutineAction?: boolean;
}

export function SelectRoutineModal({
  isOpen,
  onClose,
  onSelectRoutine,
  onStartWithoutRoutine,
  showStartWithoutRoutineAction = true,
}: SelectRoutineModalProps) {
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();
  const { locale, t } = useI18n();
  const {
    items,
    loadingInitial,
    loadingMore,
    hasMore,
    loadMore,
    reload,
    searchQuery,
    setSearchQuery,
  } = useRoutinePicker(locale);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void reload();
  }, [isOpen, reload]);

  const handleSelectRoutine = (routine: WorkoutRoutinePickerItem) => {
    onSelectRoutine?.(routine);
    onClose();
  };

  const handleStartWithoutRoutine = () => {
    onStartWithoutRoutine?.();
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
        <View style={[styles.container, { backgroundColor: palette.card }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
              {t("workouts.startWorkoutShortCta")}
            </Text>
            <WindowControlButton
              variant="close"
              size="md"
              onPress={onClose}
              accessibilityLabel={t("routines.closeActionsButton")}
              borderColor={palette.border}
              backgroundColor={palette.page}
              iconColor={palette.textPrimary}
            />
          </View>

          <View style={styles.content}>
            <ControlledSearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("workouts.startWorkoutSearchPlaceholder")}
              variant="compact"
            />

            {showStartWithoutRoutineAction ? (
              <Pressable
                onPress={handleStartWithoutRoutine}
                style={[
                  styles.startWithoutRoutineButton,
                  { borderColor: palette.border, backgroundColor: palette.page },
                ]}
              >
                <Text
                  style={[styles.startWithoutRoutineButtonText, { color: palette.textPrimary }]}
                >
                  {t("workouts.startWithoutRoutineCta")}
                </Text>
              </Pressable>
            ) : null}

            <RoutinePickerList
              items={items}
              loadingInitial={loadingInitial}
              loadingMore={loadingMore}
              hasMore={hasMore}
              loadingLabel={t("routines.loading")}
              emptyLabel={t("routines.emptyGroupFilterRoutines")}
              selectLabel={t("workouts.startWorkoutShortCta")}
              exercisesLabel={t("routines.exercisesTitle")}
              onSelect={handleSelectRoutine}
              onLoadMore={loadMore}
              palette={palette}
            />
          </View>

          <View style={{ height: Math.max(8, insets.bottom + 4) }} />
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
    height: "80%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  content: {
    flex: 1,
    gap: 10,
  },
  startWithoutRoutineButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  startWithoutRoutineButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
