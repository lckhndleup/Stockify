import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
        animation: "slide_from_right",
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
        name="stock"
        options={{
          title: "Stok Girişi",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="reports"
        options={{
          title: "Raporlar",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
