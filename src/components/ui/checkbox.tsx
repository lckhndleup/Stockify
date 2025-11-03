import React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "./icon";
import Typography from "./typography";
import type { CheckboxProps } from "@/src/types/ui";

export default function Checkbox({
  checked,
  onToggle,
  label,
  size = "md",
  color = "#E3001B",
  disabled = false,
  className = "",
  labelClassName = "",
}: CheckboxProps) {
  const sizeConfig = {
    sm: { size: 16, iconSize: 12 },
    md: { size: 20, iconSize: 14 },
    lg: { size: 24, iconSize: 16 },
  };

  const currentSize = sizeConfig[size];
  const activeColor = color ?? "#E3001B";

  const handleToggle = () => {
    if (!disabled) {
      onToggle(!checked);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={disabled}
      className={`flex-row items-center ${className}`}
      activeOpacity={0.7}
    >
      <View
        className={`border-2 rounded flex items-center justify-center ${
          checked ? "" : "bg-transparent border-stock-border"
        } ${disabled ? "opacity-50" : ""}`}
        style={{
          width: currentSize.size,
          height: currentSize.size,
          backgroundColor: checked ? activeColor : undefined,
          borderColor: checked ? activeColor : undefined,
        }}
      >
        {checked && (
          <Icon family="MaterialIcons" name="check" size={currentSize.iconSize} color="#FFFEFF" />
        )}
      </View>

      {label && (
        <Typography
          variant="body"
          className={`ml-2 text-stock-dark ${disabled ? "opacity-50" : ""} ${labelClassName}`}
        >
          {label}
        </Typography>
      )}
    </TouchableOpacity>
  );
}
