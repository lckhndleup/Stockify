import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { router, usePathname, useRouter } from "expo-router";
import Providers from "@/src/components/common/Providers";
import { BottomNavigation } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";
import "../global.css";

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Navigation hazır olduğunda auth kontrolü yap
  useEffect(() => {
    // Navigation'ın mount olması için kısa bir gecikme
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Auth kontrolü - sadece navigation hazır olduğunda
  useEffect(() => {
    if (!isNavigationReady) return;

    // Login sayfasındaysa hiçbir şey yapma
    if (pathname === "/login") return;

    // Eğer giriş yapmamışsa login sayfasına yönlendir
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, isNavigationReady]);

  // Login sayfasında BottomNavigation gösterme
  const shouldShowBottomNav = isAuthenticated && pathname !== "/login";

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
            name="login"
            options={{
              title: "Giriş",
              headerShown: false,
            }}
          />
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

        {/* BottomNavigation sadece login olmamış kullanıcılarda göster */}
        {shouldShowBottomNav && (
          <BottomNavigation className="absolute bottom-10 left-2 right-2" />
        )}
      </View>
    </Providers>
  );
}
