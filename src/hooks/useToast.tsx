// src/hooks/useToast.tsx
import { useState, useCallback } from "react";
import type { ToastState } from "@/src/types/ui";

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
      setToast({
        visible: true,
        message,
        type,
      });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, "success");
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, "error");
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast(message, "warning");
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast(message, "info");
    },
    [showToast],
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
