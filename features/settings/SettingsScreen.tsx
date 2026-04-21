import { ScrollView, StyleSheet, View } from "react-native";

import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { LanguageSettingRow } from "@/features/settings/components/LanguageSettingRow";
import { SettingsSection } from "@/features/settings/components/SettingsSection";
import { ThemeSettingRow } from "@/features/settings/components/ThemeSettingRow";
import Colors from "@/constants/Colors";

export function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const palette = useRetroPalette();

  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const textColor = Colors[colorScheme ?? "light"].text;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection
          title={t("settings.appearance") || "Appearance"}
          textColor={textColor}
          borderColor={palette.border}
        >
          <ThemeSettingRow />
        </SettingsSection>

        <SettingsSection
          title={t("settings.language") || "Language"}
          textColor={textColor}
          borderColor={palette.border}
        >
          <LanguageSettingRow />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
});
