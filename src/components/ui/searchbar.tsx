import React from "react";
import { View, TextInput } from "react-native";
import Icon from "./icon";
import type { SearchBarProps } from "@/src/types/ui";

export default function SearchBar({
  placeholder = "Ara...",
  onSearch,
  className = "",
  ...props
}: SearchBarProps) {
  const handleChangeText = (text: string) => {
    onSearch?.(text);
    props.onChangeText?.(text);
  };

  return (
    <View
      className={`flex-row items-center bg-white border border-stock-border rounded-lg px-4 ${className}`}
      style={{ height: 52 }}
    >
      <View className="mr-3">
        <Icon family="MaterialIcons" name="search" size={20} color="#6D706F" />
      </View>

      <TextInput
        className="flex-1 text-base text-stock-dark font-normal"
        placeholder={placeholder}
        placeholderTextColor="#73767A"
        textAlign="left"
        textAlignVertical="center"
        style={{
          height: 52,
          paddingVertical: 12,
          paddingHorizontal: 4,
          margin: 0,
          lineHeight: 20,
        }}
        multiline={false}
        onChangeText={handleChangeText}
        {...props}
      />
    </View>
  );
}
