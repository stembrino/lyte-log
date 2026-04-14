import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRetroPalette } from "@/components/hooks/useRetroPalette";
import { monoFont } from "@/constants/retroTheme";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  type ImageSourcePropType,
  View,
} from "react-native";

type ImagePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageSource: ImageSourcePropType | null;
  title?: string;
};

export function ImagePreviewModal({ isOpen, onClose, imageSource, title }: ImagePreviewModalProps) {
  const palette = useRetroPalette();

  if (!imageSource) {
    return null;
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.9)" }]}>
        <View style={styles.header}>
          {title && (
            <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
          )}
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <FontAwesome name="times-circle-o" size={28} color={palette.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
            testID="image-preview"
          />
        </View>

        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 12,
    right: 12,
    left: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  imageContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  image: {
    width: 300,
    height: 300,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});
