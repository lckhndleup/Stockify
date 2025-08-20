import React from "react";
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  ModalProps as RNModalProps,
} from "react-native";
import Typography from "./typography";
import Icon from "./icon";

interface ModalProps extends RNModalProps {
  children: React.ReactNode;
  title?: string;
  visible: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  overlayClosable?: boolean;
  className?: string;
}

export default function Modal({
  children,
  title,
  visible,
  onClose,
  size = "md",
  showCloseButton = true,
  overlayClosable = true,
  className = "",
  ...props
}: ModalProps) {
  const sizeClasses = {
    sm: "w-72 max-w-sm",
    md: "w-80 max-w-md",
    lg: "w-96 max-w-lg",
    xl: "w-[28rem] max-w-xl",
    full: "w-full h-full",
  };

  const handleOverlayPress = () => {
    if (overlayClosable) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      {...props}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 items-center justify-center px-6 py-8"
        activeOpacity={1}
        onPress={handleOverlayPress}
      >
        <TouchableOpacity
          className={`bg-stock-white rounded-xl shadow-lg ${sizeClasses[size]} ${className}`}
          activeOpacity={1}
          onPress={() => {}} // Prevent modal close when pressing inside
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-stock-border">
              {title && (
                <Typography
                  variant="h4"
                  className="flex-1 text-stock-dark"
                  weight="semibold"
                >
                  {title}
                </Typography>
              )}
              {showCloseButton && (
                <Icon
                  family="MaterialIcons"
                  name="close"
                  size={24}
                  color="#6D706F"
                  pressable
                  onPress={onClose}
                  containerClassName="ml-4 p-1 hover:bg-stock-gray rounded-full"
                />
              )}
            </View>
          )}

          {/* Content */}
          <View className="px-6 py-4">{children}</View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}
