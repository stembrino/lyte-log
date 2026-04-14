import { useCallback, useState } from "react";
import { Pressable, type ImageSourcePropType } from "react-native";
import { Avatar } from "@/components/Avatar";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";

type AvatarSize = "sm" | "md" | "lg";

type AvatarWithPreviewProps = {
  label: string;
  size?: AvatarSize;
  imageSource?: ImageSourcePropType | null;
  previewTitle?: string;
};

export function AvatarWithPreview({
  label,
  size = "md",
  imageSource,
  previewTitle,
}: AvatarWithPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePress = useCallback(() => {
    if (imageSource) {
      setIsPreviewOpen(true);
    }
  }, [imageSource]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  // If no image, just render Avatar as-is (no Pressable wrapper needed)
  if (!imageSource) {
    return <Avatar label={label} size={size} imageSource={imageSource} />;
  }

  // If has image, wrap in Pressable to enable preview
  return (
    <>
      <Pressable onPress={handlePress} testID="avatar-preview-trigger" accessibilityRole="button">
        <Avatar label={label} size={size} imageSource={imageSource} />
      </Pressable>
      {isPreviewOpen ? (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          imageSource={imageSource}
          title={previewTitle}
        />
      ) : null}
    </>
  );
}
