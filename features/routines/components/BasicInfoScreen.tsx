import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { monoFont } from "@/constants/retroTheme";
import { DEFAULT_ROUTINE_TAGS } from "@/constants/seed/routineTags";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Palette = ReturnType<typeof useRetroPalette>;
type TFn = ReturnType<typeof useI18n>["t"];

export type BasicInfoScreenProps = {
  name: string;
  onChangeName: (v: string) => void;
  duration: string;
  onChangeDuration: (v: string) => void;
  selectedTags: Set<string>;
  onToggleTag: (tagId: string) => void;
  palette: Palette;
  t: TFn;
};

export function BasicInfoScreen({
  name,
  onChangeName,
  duration,
  onChangeDuration,
  selectedTags,
  onToggleTag,
  palette,
  t,
}: BasicInfoScreenProps) {
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <View style={styles.screen}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formNameLabel")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: palette.border,
                color: palette.textPrimary,
                backgroundColor: palette.card,
              },
            ]}
            placeholder={t("routines.formNamePlaceholder")}
            placeholderTextColor={palette.textSecondary}
            value={name}
            onChangeText={onChangeName}
            maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formDurationLabel")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: palette.border,
                color: palette.textPrimary,
                backgroundColor: palette.card,
              },
            ]}
            placeholder={t("routines.formDurationPlaceholder")}
            placeholderTextColor={palette.textSecondary}
            value={duration}
            onChangeText={onChangeDuration}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formTagsLabel")}
          </Text>
          <View style={styles.tagList}>
            {DEFAULT_ROUTINE_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagOption,
                  {
                    borderColor: palette.border,
                    backgroundColor: selectedTags.has(tag.id) ? palette.accent : palette.card,
                  },
                ]}
                onPress={() => onToggleTag(tag.id)}
              >
                <Text
                  style={[
                    styles.tagOptionText,
                    {
                      color: selectedTags.has(tag.id) ? palette.card : palette.textPrimary,
                    },
                  ]}
                >
                  {selectedTags.has(tag.id) ? "✓" : "○"} {t(`routines.tags.${tag.i18nKey}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 20,
  },
  screen: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
  },
  tagList: {
    gap: 8,
  },
  tagOption: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagOptionText: {
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
