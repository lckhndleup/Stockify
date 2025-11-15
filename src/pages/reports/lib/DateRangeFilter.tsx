// app/reports/lib/DateRangeFilter.tsx
import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Card, Typography, Icon } from "@/src/components/ui";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate?: number, endDate?: number) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange }) => {
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month" | "all">("today");

  const getDateRange = (range: "today" | "week" | "month" | "all") => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (range) {
      case "today":
        return {
          start: startOfDay.getTime(),
          end: new Date().getTime(),
        };
      case "week": {
        const weekAgo = new Date(startOfDay);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          start: weekAgo.getTime(),
          end: new Date().getTime(),
        };
      }
      case "month": {
        const monthAgo = new Date(startOfDay);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          start: monthAgo.getTime(),
          end: new Date().getTime(),
        };
      }
      case "all":
        return { start: undefined, end: undefined };
    }
  };

  const handleRangeSelect = (range: "today" | "week" | "month" | "all") => {
    setSelectedRange(range);
    const dateRange = getDateRange(range);
    onDateRangeChange(dateRange.start, dateRange.end);
  };

  const ranges: Array<{ key: "today" | "week" | "month" | "all"; label: string; icon: string }> = [
    { key: "today", label: "Bugün", icon: "today" },
    { key: "week", label: "Bu Hafta", icon: "date-range" },
    { key: "month", label: "Bu Ay", icon: "calendar-today" },
    { key: "all", label: "Tümü", icon: "all-inclusive" },
  ];

  return (
    <Card variant="outlined" padding="sm">
      <View className="flex-row gap-2">
        {ranges.map((range) => {
          const isSelected = selectedRange === range.key;
          return (
            <TouchableOpacity
              key={range.key}
              onPress={() => handleRangeSelect(range.key)}
              className="flex-1"
              activeOpacity={0.7}
            >
              <View
                className={`p-3 rounded-lg items-center ${
                  isSelected ? "bg-red-600" : "bg-gray-100"
                }`}
              >
                <Icon
                  family="MaterialIcons"
                  name={range.icon}
                  size={20}
                  color={isSelected ? "#FFFFFF" : "#6B7280"}
                />
                <Typography
                  variant="caption"
                  weight={isSelected ? "semibold" : "normal"}
                  className={`mt-1 ${isSelected ? "text-white" : "text-gray-600"}`}
                >
                  {range.label}
                </Typography>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
};
