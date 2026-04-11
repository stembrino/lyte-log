import { CharacterCounter } from "@/components/CharacterCounter";
import { Chip } from "@/components/Chip";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { FALLBACK_ROUTINE_TAGS } from "@/constants/fallback/routineTags";
import { monoFont } from "@/constants/retroTheme";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { RoutineGroupOption } from "./types";

type Palette = ReturnType<typeof useRetroPalette>;
type TFn = ReturnType<typeof useI18n>["t"];
type Locale = ReturnType<typeof useI18n>["locale"];

export type BasicInfoScreenProps = {
  name: string;
  onChangeName: (v: string) => void;
  routineGroups: RoutineGroupOption[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  detail: string;
  onChangeDetail: (v: string) => void;
  description: string;
  onChangeDescription: (v: string) => void;
  selectedTags: Set<string>;
  onToggleTag: (tagId: string) => void;
  locale: Locale;
  palette: Palette;
  t: TFn;
};

export function BasicInfoScreen({
  name,
  onChangeName,
  routineGroups,
  selectedGroupId,
  onSelectGroup,
  detail,
  onChangeDetail,
  description,
  onChangeDescription,
  selectedTags,
  onToggleTag,
  locale,
  palette,
  t,
}: BasicInfoScreenProps) {
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <View style={styles.screen}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formNameLabel")}
            <Text style={{ color: palette.accent }}> *</Text>
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
          <CharacterCounter
            currentLength={name.length}
            maxLength={50}
            color={palette.textSecondary}
            accentColor={palette.accent}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            GROUP
            <Text style={{ color: palette.accent }}> *</Text>
          </Text>
          <Text style={[styles.helperText, { color: palette.textSecondary }]}>
            Select the group this routine belongs to.
          </Text>
          <View style={styles.tagList}>
            {routineGroups.map((group) => (
              <Chip
                key={group.id}
                label={group.name}
                selected={selectedGroupId === group.id}
                onPress={() => onSelectGroup(group.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formDetailLabel")}
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
            placeholder={t("routines.formDetailPlaceholder")}
            placeholderTextColor={palette.textSecondary}
            value={detail}
            onChangeText={onChangeDetail}
            maxLength={60}
          />
          <CharacterCounter
            currentLength={detail.length}
            maxLength={60}
            color={palette.textSecondary}
            accentColor={palette.accent}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formDescriptionLabel")}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              {
                borderColor: palette.border,
                color: palette.textPrimary,
                backgroundColor: palette.card,
              },
            ]}
            placeholder={t("routines.formDescriptionPlaceholder")}
            placeholderTextColor={palette.textSecondary}
            value={description}
            onChangeText={onChangeDescription}
            maxLength={280}
            multiline
            textAlignVertical="top"
          />
          <CharacterCounter
            currentLength={description.length}
            maxLength={280}
            color={palette.textSecondary}
            accentColor={palette.accent}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>
            {t("routines.formTagsLabel")}
          </Text>
          <View style={styles.tagList}>
            {FALLBACK_ROUTINE_TAGS.map((tag) => (
              <Chip
                key={tag.id}
                label={locale === "pt-BR" ? tag.labelPt : tag.labelEn}
                selected={selectedTags.has(tag.id)}
                onPress={() => onToggleTag(tag.id)}
              />
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
  helperText: {
    fontFamily: monoFont,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: monoFont,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
