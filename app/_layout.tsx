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
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Navigation hazır olduğunda auth kontrolü yap
  useEffect(() => {
    console.log("📱 RootLayout mounted");
    // Navigation'ın mount olması için kısa bir gecikme
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
      console.log("✅ Navigation ready");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Auth initialization - token'ı API service'e restore et
  useEffect(() => {
    if (isNavigationReady) {
      console.log("🔄 Starting auth initialization...");
      initializeAuth();
    }
  }, [isNavigationReady, initializeAuth]);

  // Auth kontrolü - sadece navigation hazır olduğunda
  useEffect(() => {
    if (!isNavigationReady) return;

    console.log("🔍 Auth check:", {
      pathname,
      isAuthenticated,
      shouldRedirect: pathname !== "/login" && !isAuthenticated,
    });

    // Login sayfasındaysa hiçbir şey yapma
    if (pathname === "/login") return;

    // Eğer giriş yapmamışsa login sayfasına yönlendir
    if (!isAuthenticated) {
      console.log("🔄 Redirecting to login...");
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, isNavigationReady]);

  // Login sayfasında BottomNavigation gösterme
  const shouldShowBottomNav = isAuthenticated && pathname !== "/login";

  console.log("🎯 RootLayout render:", {
    pathname,
    isAuthenticated,
    shouldShowBottomNav,
    isNavigationReady,
  });

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
          <Stack.Screen
            name="brokerDetail"
            options={{
              title: "Aracı Detayı",
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
