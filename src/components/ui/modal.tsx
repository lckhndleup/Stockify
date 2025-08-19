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
    sm: "w-80 max-w-sm",
    md: "w-96 max-w-md",
    lg: "w-[28rem] max-w-lg",
    xl: "w-[32rem] max-w-xl",
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
        className="flex-1 bg-black/50 items-center justify-center p-4"
        activeOpacity={1}
        onPress={handleOverlayPress}
      >
        <TouchableOpacity
          className={`bg-white rounded-xl ${sizeClasses[size]} ${className}`}
          activeOpacity={1}
          onPress={() => {}} // Prevent modal close when pressing inside
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              {title && (
                <Typography variant="h4" className="flex-1">
                  {title}
                </Typography>
              )}
              {showCloseButton && (
                <Icon
                  family="MaterialIcons"
                  name="close"
                  size={24}
                  pressable
                  onPress={onClose}
                  containerClassName="ml-4 p-1"
                />
              )}
            </View>
          )}

          {/* Content */}
          <View className="p-4">{children}</View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}
