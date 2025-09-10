import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Link, usePathname } from "expo-router";
import Icon from "./icon";
import type {
  BottomNavigationProps,
  AppRoute,
  NavigationItem,
} from "@/src/types/navigation";

export default function BottomNavigation({
  className = "",
}: BottomNavigationProps) {
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      icon: { family: "MaterialCommunityIcons", name: "home" },
      label: "Ana Sayfa",
      path: "/",
    },
    {
      icon: { family: "MaterialCommunityIcons", name: "chart-line" },
      label: "Stok",
      path: "/stock",
    },
    {
      icon: { family: "MaterialCommunityIcons", name: "account-group" },
      label: "Aracılar",
      path: "/brokers",
    },
  ];

  return (
    <View
      className={`${className}`}
      style={{
        height: 58,
        backgroundColor: "transparent",
      }}
    >
      <View className="flex-row items-center h-full" style={{ gap: 8 }}>
        {/* Soldaki menü grubu - artık daha geniş */}
        <View
          className="bg-stock-black rounded-full flex-row items-center overflow-hidden flex-1"
          style={{
            height: 58,
            paddingHorizontal: 4,
            paddingVertical: 4,
          }}
        >
          {navigationItems.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <Link key={index} href={item.path as any} asChild>
                <TouchableOpacity
                  className={`py-2 flex-row items-center rounded-full ${
                    isActive ? "bg-stock-gray px-6" : "bg-transparent px-3"
                  }`}
                  style={{
                    flex: isActive ? 1.7 : 1,
                    height: 50,
                    justifyContent: "center",
                    minWidth: isActive ? 60 : 50,
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    family={item.icon.family}
                    name={item.icon.name}
                    size={20}
                    color={isActive ? "#222222" : "#FFFEFF"}
                  />

                  {isActive && (
                    <Text
                      className="ml-2"
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#222222",
                      }}
                    >
                      {item.label}
                    </Text>
                  )}
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>

        {/* Sağdaki artı butonu */}
        <Link href="/products" asChild>
          <TouchableOpacity
            className="bg-stock-red rounded-full items-center justify-center"
            style={{
              height: 58,
              width: 58,
              aspectRatio: 1,
              shadowColor: "#E3001B", // stock-red
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 5,
            }}
            activeOpacity={0.8}
          >
            <Icon family="MaterialIcons" name="add" size={28} color="#FFFEFF" />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
