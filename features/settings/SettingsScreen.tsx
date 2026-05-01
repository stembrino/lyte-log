import { ScrollView, StyleSheet, View } from "react-native";

import { useColorScheme } from "@/components/hooks/useColorScheme";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { LanguageSettingRow } from "@/features/settings/components/LanguageSettingRow";
import { DefaultGymSettingRow } from "@/features/settings/components/DefaultGymSettingRow";
import { SettingsSection } from "@/features/settings/components/SettingsSection";
import { ThemeSettingRow } from "@/features/settings/components/ThemeSettingRow";
import { RateAppSettingRow } from "@/features/settings/components/RateAppSettingRow";
import Colors from "@/constants/Colors";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

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

        <SettingsSection
          title={t("settings.workout") || "Workout"}
          textColor={textColor}
          borderColor={palette.border}
        >
          <DefaultGymSettingRow />
        </SettingsSection>

        {FEATURE_FLAGS.settingsRateApp ? (
          <SettingsSection
            title={t("settings.rateApp") || "Rate App"}
            textColor={textColor}
            borderColor={palette.border}
          >
            <RateAppSettingRow />
          </SettingsSection>
        ) : null}
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
