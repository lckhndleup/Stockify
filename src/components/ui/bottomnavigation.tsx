import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Link, usePathname } from "expo-router";
import Icon from "./icon";

interface BottomNavigationProps {
  className?: string;
}

type AppRoute = "/" | "/stock" | "/brokers" | "/products";

interface NavigationItem {
  icon: {
    family: "MaterialIcons" | "MaterialCommunityIcons" | "Feather" | "AntDesign" | "Ionicons";
    name: string;
  };
  label: string;
  path: AppRoute;
}

export default function BottomNavigation({ className = "" }: BottomNavigationProps) {
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
      className={`bg-transparent ${className}`}
      style={{
        height: 58,
        paddingHorizontal: 6, // Ana container içinde kenar boşluğu
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
      }}
    >
      <View className="flex-row items-center justify-between h-full">
        {/* Soldaki menü grubu */}
        <View 
          className="bg-[#222222] rounded-full flex-row items-center overflow-hidden"
          style={{
            height: 58,
            flex: 0.75,
            paddingHorizontal: 4,
            paddingVertical: 4,
            marginRight: 10, // Artı butonuna biraz boşluk bırak
          }}
        >
          {navigationItems.map((item, index) => {
            const isActive = pathname === item.path;
            
            return (
              <Link key={index} href={item.path as any} asChild>
                <TouchableOpacity
                  className={`px-4 py-2 flex-row items-center rounded-full ${
                    isActive ? "bg-stock-gray" : "bg-transparent"
                  }`}
                  style={{ flex: 1, height: 50, justifyContent: "center" }}
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
                      style={{ fontSize: 14, fontWeight: "600", color: "#222222" }}
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
            className="bg-[#222222] rounded-full items-center justify-center"
            style={{
              height: 58,
              width: 58,
              borderRadius: 29, // Tam yuvarlak olması için çapın yarısı
              aspectRatio: 1, // Tam kare (eşit en-boy)
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
            }}
            activeOpacity={0.8}
          >
            <Icon family="MaterialIcons" name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
