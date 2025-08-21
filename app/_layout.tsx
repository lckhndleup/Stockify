import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import Providers from "@/src/components/common/Providers";
import { BottomNavigation } from "@/src/components/ui";
import "../global.css";

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="auto" hidden={true} />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#fff",
            },
            headerTintColor: "#000",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "Stockify",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="products"
            options={{
              title: "Ürünler",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="brokers"
            options={{
              title: "Aracılar",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="stock"
            options={{
              title: "Stok Takip",
              headerShown: true,
            }}
          />
        </Stack>
        <BottomNavigation className="absolute bottom-10 left-2 right-2" />
      </View>
    </Providers>
  );
}
