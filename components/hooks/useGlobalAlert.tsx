import { GlobalAlertModal, type GlobalAlertAction } from "@/components/GlobalAlertModal";
import { useMemo, useState } from "react";

type AlertConfig = {
  title: string;
  message: string;
  actions: GlobalAlertAction[];
};

type ShowAlertArgs = {
  title: string;
  message: string;
  buttonLabel: string;
  onPress?: () => void;
};

type ShowConfirmArgs = {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "destructive";
  onConfirm: () => void;
  onCancel?: () => void;
};

export function useGlobalAlert() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const close = () => {
    setConfig(null);
  };

  const showAlert = (args: ShowAlertArgs) => {
    setConfig({
      title: args.title,
      message: args.message,
      actions: [
        {
          label: args.buttonLabel,
          onPress: () => {
            close();
            args.onPress?.();
          },
        },
      ],
    });
  };

  const showConfirm = (args: ShowConfirmArgs) => {
    setConfig({
      title: args.title,
      message: args.message,
      actions: [
        {
          label: args.cancelLabel,
          onPress: () => {
            close();
            args.onCancel?.();
          },
        },
        {
          label: args.confirmLabel,
          variant: args.confirmVariant ?? "primary",
          onPress: () => {
            close();
            args.onConfirm();
          },
        },
      ],
    });
  };

  const alertElement = useMemo(
    () => (
      <GlobalAlertModal
        visible={Boolean(config)}
        title={config?.title ?? ""}
        message={config?.message ?? ""}
        actions={config?.actions ?? []}
      />
    ),
    [config],
  );

  return {
    showAlert,
    showConfirm,
    close,
    alertElement,
  };
}
