import React from "react";
import { Text, TextProps } from "react-native";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "overline";
  size?:
    | "xs"
    | "sm"
    | "base"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl";
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
}

export default function Typography({
  children,
  variant = "body",
  size,
  weight,
  color,
  align,
  className = "",
  ...props
}: TypographyProps) {
  const variantStyles = {
    h1: { size: "4xl", weight: "bold" },
    h2: { size: "3xl", weight: "bold" },
    h3: { size: "2xl", weight: "semibold" },
    h4: { size: "xl", weight: "semibold" },
    body: { size: "base", weight: "normal" },
    caption: { size: "sm", weight: "normal" },
    overline: { size: "xs", weight: "medium" },
  };

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
  };

  const weightClasses = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const colorClasses = {
    primary: "text-primary-500",
    secondary: "text-secondary-400",
    success: "text-success-500",
    danger: "text-danger-500",
    warning: "text-warning-500",
    info: "text-info-500",
    "text-primary": "text-text-primary",
    "text-secondary": "text-text-secondary",
    "text-tertiary": "text-text-tertiary",
    "text-inverse": "text-text-inverse",
    white: "text-white",
    black: "text-black",
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  };

  // Variant'dan default değerleri al, props ile override et
  const finalSize = size || variantStyles[variant].size;
  const finalWeight = weight || variantStyles[variant].weight;

  const classes = [
    sizeClasses[finalSize as keyof typeof sizeClasses],
    weightClasses[finalWeight as keyof typeof weightClasses],
    color && colorClasses[color],
    align && alignClasses[align],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Text className={classes} {...props}>
      {children}
    </Text>
  );
}
