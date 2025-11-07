// UI Components için ortak type'lar
import React from "react";
import {
  ViewProps,
  TextProps,
  TextInputProps,
  TouchableOpacityProps,
  ModalProps as RNModalProps,
} from "react-native";

// Dropdown component için props interface
export interface DropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  className?: string;
  onAddCategory?: () => void;
  showAddButton?: boolean;
  loading?: boolean;
  error?: string;
}

// SelectBox option tipi
export interface SelectBoxOption {
  label: string;
  value: string;
}

// SelectBox props tipi
export interface SelectBoxProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectBoxOption[];
  onSelect: (value: string) => void;
  error?: string;
  className?: string;
  helperText?: string;
  variant?: "default" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  inputClassName?: string;
}

// Categories sayfasında kullanılan Category tipi
export interface CategoryDisplay {
  id: string;
  name: string;
  taxRate: number;
  createdDate: string;
  isActive: boolean;
}

// UI Component Props
export interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  loadingIndicatorColor?: string;
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  numericOnly?: boolean;
  className?: string;
  inputClassName?: string;
  style?: any;
}

export interface ContainerProps extends ViewProps {
  variant?: "default" | "padded" | "centered";
  fullHeight?: boolean;
  className?: string;
  safeTop?: boolean;
  safeBottom?: boolean;
  center?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  pressable?: boolean;
  onPress?: () => void;
  className?: string;
}

export interface ModalProps extends RNModalProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  title?: string;
  overlayClosable?: boolean;
  className?: string;
  coverScreen?: boolean;
}

export interface BottomSheetProps extends RNModalProps {
  children: React.ReactNode;
  title?: string;
  visible: boolean;
  onClose: () => void;
  height?: "small" | "medium" | "large" | "full";
  showCloseButton?: boolean;
  overlayClosable?: boolean;
  backdropOpacity?: number;
  animationType?: "slide" | "fade" | "none";
}

export interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  visible: boolean;
  onHide?: () => void;
  duration?: number;
  position?: "top" | "bottom" | "center";
}

export interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  className?: string;
  overlay?: boolean;
  style?: any;
  speed?: number;
}

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  margin?: number;
  className?: string;
  style?: any;
}

export interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "overline";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  weight?: "light" | "normal" | "medium" | "semibold" | "bold";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "text-primary"
    | "text-secondary"
    | "text-tertiary"
    | "text-inverse"
    | "white"
    | "black";
  align?: "left" | "center" | "right" | "justify";
  className?: string;
  style?: any;
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
}

export interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export interface SearchBarProps extends TextInputProps {
  onSearch: (text: string) => void;
  showClearButton?: boolean;
  placeholder?: string;
  className?: string;
}

export interface SquareCardProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  size?: number;
  variant?: "default" | "outlined" | "elevated";
  className?: string;
  title?: string;
  subtitle?: string;
  amount?: string;
  onDelete?: () => void;
  showDeleteIcon?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
}

// Icon types
export type IconFamily =
  | "MaterialIcons"
  | "MaterialCommunityIcons"
  | "Feather"
  | "AntDesign"
  | "Ionicons";

export interface IconProps {
  family?: IconFamily;
  name: string;
  size?: number;
  color?: string;
  pressable?: boolean;
  onPress?: () => void;
  className?: string;
  containerClassName?: string;
}

// Hook Types
export interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
}
