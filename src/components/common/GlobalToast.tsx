import React from "react";
import Toast from "@/src/components/ui/toast";
import { useAppStore } from "@/src/stores/appStore";

const GlobalToast = () => {
  const { globalToast, hideGlobalToast } = useAppStore();

  return (
    <Toast
      visible={globalToast.visible}
      message={globalToast.message}
      type={globalToast.type}
      onHide={hideGlobalToast}
      position="top"
      offset={180}
    />
  );
};

export default GlobalToast;
