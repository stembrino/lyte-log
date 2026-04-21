import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import Colors from "@/constants/Colors";
import { monoFont } from "@/constants/retroTheme";

export function LanguageSettingRow() {
  const colorScheme = useColorScheme();
  const palette = useRetroPalette();
  const { locale, toggleLocale, t } = useI18n();
  const textColor = Colors[colorScheme ?? "light"].text;

  return (
    <Pressable style={styles.settingRow} onPress={toggleLocale}>
      <View style={styles.settingContent}>
        <FontAwesome name="globe" size={18} color={palette.accent} style={{ marginRight: 12 }} />
        <Text style={[styles.settingLabel, { color: textColor }]}>
          {t("settings.currentLanguage") || "Language"}
        </Text>
      </View>
      <Text style={[styles.settingValue, { color: palette.textSecondary }]}>
        {locale === "pt-BR" ? "Portugues" : "English"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "600",
  },
  settingValue: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
