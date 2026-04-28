import { monoFont } from "@/constants/retroTheme";
import type { ExerciseTopSetState } from "@/features/workouts/hooks/useExerciseTopSet";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Palette = {
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
};

type InProgressExerciseTopSetSectionProps = {
  palette: Palette;
  t: (key: string, vars?: Record<string, unknown>) => string;
  topSetState: ExerciseTopSetState;
  onLoadTopSet: () => void;
  onRetryTopSet: () => void;
  onApplyTopSet?: () => Promise<void>;
  applyingTopSet?: boolean;
  onCopyTopSetSession?: () => Promise<void>;
  copyingTopSetSession?: boolean;
  getRelativeDaysLabel: (input: string) => string;
};

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

export function InProgressExerciseTopSetSection({
  palette,
  t,
  topSetState,
  onLoadTopSet,
  onRetryTopSet,
  onApplyTopSet,
  applyingTopSet,
  onCopyTopSetSession,
  copyingTopSetSession,
  getRelativeDaysLabel,
}: InProgressExerciseTopSetSectionProps) {
  if (topSetState.status === "idle") {
    return (
      <TouchableOpacity
        style={[styles.actionButton, { borderColor: palette.border }]}
        onPress={onLoadTopSet}
      >
        <Text style={[styles.actionButtonText, { color: palette.textPrimary }]}>
          {t("workouts.historyPanelLoadTopSetCta")}
        </Text>
      </TouchableOpacity>
    );
  }

  if (topSetState.status === "loading") {
    return (
      <Text style={[styles.message, { color: palette.textSecondary }]}>
        {t("workouts.historyPanelTopSetLoading")}
      </Text>
    );
  }

  if (topSetState.status === "error") {
    return (
      <View style={styles.contentGroup}>
        <Text style={[styles.message, { color: palette.textSecondary }]}>
          {t("workouts.historyPanelTopSetError")}
        </Text>
        <Text style={[styles.retryText, { color: palette.accent }]} onPress={onRetryTopSet}>
          {t("workouts.historyPanelTopSetRetry")}
        </Text>
      </View>
    );
  }

  if (topSetState.status === "empty") {
    return (
      <Text style={[styles.message, { color: palette.textSecondary }]}>
        {t("workouts.historyPanelTopSetEmpty")}
      </Text>
    );
  }

  return (
    <View style={styles.contentGroup}>
      <Text style={[styles.message, { color: palette.textSecondary }]}>
        {`${t("workouts.historyPanelTopSetPrefix")}: ${formatNumber(topSetState.snapshot.topSet.set.weight)}${t("workouts.weightUnit")} x ${topSetState.snapshot.topSet.set.reps} ${t("workouts.repsUnitSuffix")}`}
      </Text>
      <Text style={[styles.message, { color: palette.textSecondary }]}>
        {`${t("workouts.historyPanelLastSessionPrefix")}: ${getRelativeDaysLabel(topSetState.snapshot.topSet.workoutDate)}`}
      </Text>
      <Text style={[styles.message, { color: palette.textSecondary }]}>
        {`${t("workouts.gymFieldLabel")}: ${topSetState.snapshot.topSet.gymName ?? t("workouts.gymNotDefined")}`}
      </Text>

      {topSetState.snapshot.session?.sets.length ? (
        <View style={styles.setList}>
          {topSetState.snapshot.session.sets.map((setRow) => {
            const isTopSet = setRow.id === topSetState.snapshot.topSet.set.id;
            return (
              <View key={setRow.id} style={styles.setRow}>
                <Text style={[styles.setText, { color: palette.textPrimary }]}>
                  {t("workouts.setLabel")} {setRow.setOrder}: {formatNumber(setRow.weight)}
                  {t("workouts.weightUnit")} x {setRow.reps} {t("workouts.repsUnitSuffix")}
                </Text>
                {isTopSet ? (
                  <View style={styles.topActionsRow}>
                    <View style={[styles.topBadge, { borderColor: palette.accent }]}>
                      <FontAwesome name="arrow-up" size={8} color={palette.accent} />
                      <Text style={[styles.topBadgeText, { color: palette.accent }]}>TOP</Text>
                    </View>
                    {onApplyTopSet ? (
                      <TouchableOpacity
                        style={[styles.miniActionButton, { borderColor: palette.accent }]}
                        onPress={onApplyTopSet}
                        disabled={applyingTopSet}
                        accessibilityRole="button"
                        accessibilityLabel={t("workouts.historyPanelApplyTopSetButton")}
                      >
                        <FontAwesome name="copy" size={10} color={palette.accent} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {onCopyTopSetSession ? (
        <TouchableOpacity
          style={[styles.applyButton, { borderColor: palette.accent }]}
          onPress={onCopyTopSetSession}
          disabled={copyingTopSetSession}
        >
          <Text style={[styles.applyButtonText, { color: palette.accent }]}>
            {copyingTopSetSession
              ? t("routines.loading")
              : t("workouts.historyPanelApplyTopSetSessionButton")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contentGroup: {
    gap: 2,
  },
  message: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  retryText: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  actionButton: {
    minHeight: 32,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  applyButton: {
    minHeight: 32,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 10,
  },
  applyButtonText: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  setList: {
    marginTop: 4,
    gap: 2,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  setText: {
    flexShrink: 1,
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniActionButton: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  topBadgeText: {
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
