import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppKeyboardAvoidingView } from "@/components/AppKeyboardAvoidingView";
import { WindowControlButton } from "@/components/WindowControlButton";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { useI18n } from "@/components/providers/i18n-provider";
import { useGlobalAlert } from "@/components/hooks/useGlobalAlert";
import { monoFont } from "@/constants/retroTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function FeedbackModal({ isOpen, onClose }: Props) {
  const { t } = useI18n();
  const palette = useRetroPalette();
  const insets = useSafeAreaInsets();
  const { showAlert, alertElement } = useGlobalAlert();

  const [comment, setComment] = useState("");
  const [bugReport, setBugReport] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setComment("");
    setBugReport("");
    setFeatureRequest("");
    setRating(null);
    setSubmitting(false);
  }, [isOpen]);

  const handleClose = () => {
    setComment("");
    setBugReport("");
    setFeatureRequest("");
    setRating(null);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedComment = comment.trim();
    const trimmedBugReport = bugReport.trim();
    const trimmedFeatureRequest = featureRequest.trim();

    if (!trimmedComment && !trimmedBugReport && !trimmedFeatureRequest) {
      showAlert({
        title: t("settings.feedbackEmptyTitle"),
        message: t("settings.feedbackEmptyMessage"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
      return;
    }

    setSubmitting(true);

    try {
      const ratingText = rating ? ` (Rating: ${rating}/5 stars)` : "";
      const sections = [
        trimmedComment ? `${t("settings.feedbackComment")}:\n${trimmedComment}` : null,
        trimmedBugReport ? `${t("settings.feedbackBug")}:\n${trimmedBugReport}` : null,
        trimmedFeatureRequest
          ? `${t("settings.feedbackFeature")}:\n${trimmedFeatureRequest}`
          : null,
      ].filter(Boolean);
      const emailBody = `Feedback${ratingText}\n\n${sections.join("\n\n")}`;
      const subject = "GymLog App Feedback";
      const mailtoUrl = `mailto:fabio.dev.contact@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

      const canOpenUrl = await Linking.canOpenURL(mailtoUrl);
      if (canOpenUrl) {
        await Linking.openURL(mailtoUrl);
        handleClose();
      } else {
        showAlert({
          title: t("settings.feedbackErrorTitle"),
          message: t("settings.feedbackErrorMessage"),
          buttonLabel: t("workouts.postFinishCloseCta"),
        });
      }
    } catch {
      showAlert({
        title: t("settings.feedbackErrorTitle"),
        message: t("settings.feedbackErrorMessage"),
        buttonLabel: t("workouts.postFinishCloseCta"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={isOpen} animationType="slide" onRequestClose={handleClose}>
        <AppKeyboardAvoidingView androidBehavior="padding">
          <View style={[styles.container, { backgroundColor: palette.page }]}>
            <View
              style={[
                styles.header,
                { borderBottomColor: palette.border, paddingTop: Math.max(12, insets.top + 8) },
              ]}
            >
              <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
                {t("settings.sendFeedback")}
              </Text>

              <WindowControlButton
                variant="close"
                size="md"
                onPress={handleClose}
                accessibilityLabel={t("exercises.cancel")}
                borderColor={palette.border}
                backgroundColor={palette.card}
                iconColor={palette.textPrimary}
              />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={[styles.description, { color: palette.textSecondary }]}>
                {t("settings.feedbackDescription")}
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: palette.textPrimary }]}>
                  {t("settings.feedbackRating")}
                </Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(rating === star ? null : star)}
                      style={styles.starButton}
                    >
                      <FontAwesome
                        name={star <= (rating ?? 0) ? "star" : "star-o"}
                        size={28}
                        color={star <= (rating ?? 0) ? palette.accent : palette.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: palette.textPrimary }]}>
                  {t("settings.feedbackComment")}
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
                  placeholder={t("settings.feedbackCommentPlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={6}
                  maxLength={500}
                  editable={!submitting}
                />
                <Text style={[styles.characterCount, { color: palette.textSecondary }]}>
                  {comment.length}/500
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: palette.textPrimary }]}>
                  {t("settings.feedbackBug")}
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
                  placeholder={t("settings.feedbackBugPlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  value={bugReport}
                  onChangeText={setBugReport}
                  multiline
                  numberOfLines={5}
                  maxLength={500}
                  editable={!submitting}
                />
                <Text style={[styles.characterCount, { color: palette.textSecondary }]}>
                  {bugReport.length}/500
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: palette.textPrimary }]}>
                  {t("settings.feedbackFeature")}
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
                  placeholder={t("settings.feedbackFeaturePlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  value={featureRequest}
                  onChangeText={setFeatureRequest}
                  multiline
                  numberOfLines={5}
                  maxLength={500}
                  editable={!submitting}
                />
                <Text style={[styles.characterCount, { color: palette.textSecondary }]}>
                  {featureRequest.length}/500
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: palette.accent,
                    opacity: submitting ? 0.6 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={[styles.submitButtonText, { color: palette.textPrimary }]}>
                  {submitting ? t("routines.loading") : t("settings.sendFeedbackButton")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </AppKeyboardAvoidingView>
      </Modal>

      {alertElement}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontFamily: monoFont,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 12,
  },
  starButton: {
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    minHeight: 112,
    fontFamily: monoFont,
    fontSize: 11,
    textAlignVertical: "top",
  },
  characterCount: {
    fontFamily: monoFont,
    fontSize: 10,
    marginTop: 6,
    textAlign: "right",
  },
  submitButton: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
