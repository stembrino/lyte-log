import { Badge } from "@/components/Badge";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  count: number;
  query: string;
  onChangeQuery: (value: string) => void;
  onPressCreate: () => void;
};

export function ExercisesListHeader({ count, query, onChangeQuery, onPressCreate }: Props) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View
        style={[styles.summaryCard, { backgroundColor: palette.card, borderColor: palette.border }]}
      >
        <View style={styles.summaryTopRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            {t("exercises.libraryLabel")}
          </Text>
          <Badge
            value={count}
            textColor={palette.accent}
            borderColor={palette.accent}
            backgroundColor={palette.card}
            size="sm"
          />
        </View>
        <Text style={[styles.title, { color: palette.textPrimary }]}>{t("exercises.title")}</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {t("exercises.libraryHint")}
        </Text>
      </View>
      <TextInput
        style={[
          styles.search,
          {
            backgroundColor: palette.inputBg,
            borderColor: focused ? palette.accent : palette.inputBorder,
            color: palette.textPrimary,
            borderWidth: focused ? 2 : 1,
          },
        ]}
        placeholder={t("routines.searchExercisePlaceholder")}
        placeholderTextColor={palette.textSecondary}
        value={query}
        onChangeText={onChangeQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        style={[styles.createButton, { backgroundColor: palette.accent }]}
        onPress={onPressCreate}
        accessibilityLabel={t("exercises.createExercise")}
      >
        <Text style={styles.createLabel}>{t("exercises.createExercise")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 12,
    gap: 8,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 18,
  },
  search: {
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
    minHeight: 44,
  },
  createButton: {
    borderRadius: 2,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  createLabel: {
    color: "#FFFFFF",
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
