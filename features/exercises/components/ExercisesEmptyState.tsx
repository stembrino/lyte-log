import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { StyleSheet, Text, View } from "react-native";

export function ExercisesEmptyState() {
  const { t } = useI18n();
  const palette = useRetroPalette();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>
        {t("exercises.emptyExercises")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontFamily: monoFont,
    fontSize: 14,
    textAlign: "center",
  },
});
