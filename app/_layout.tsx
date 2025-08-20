import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Providers from "@/src/components/common/Providers";
import "../global.css";

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="auto" hidden={true} />
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
    </Providers>
  );
}
