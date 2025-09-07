import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity } from "react-native";
import { router, usePathname, useRouter } from "expo-router";
import Providers from "@/src/components/common/Providers";
import { BottomNavigation, Icon } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";
import "../global.css";

// Custom Header Left Component
const CustomHeaderLeft = () => (
  <TouchableOpacity
    onPress={() => router.push("/")}
    style={{ marginLeft: -5 }}
    activeOpacity={0.7}
  >
    <Icon family="MaterialIcons" name="arrow-back" size={24} color="#000" />
  </TouchableOpacity>
);

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
  // Login sayfasında ve sections altında BottomNavigation gösterme
  const shouldShowBottomNav =
    isAuthenticated &&
    pathname !== "/login" &&
    !pathname.includes("/broker/sections/"); // Sections altındaki tüm sayfalar

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
              headerLeft: CustomHeaderLeft,
            }}
          />
          <Stack.Screen
            name="brokers"
            options={{
              title: "Aracılar",
              headerShown: true,
              headerLeft: CustomHeaderLeft,
            }}
          />
          <Stack.Screen
            name="stock"
            options={{
              title: "Stok Takip",
              headerShown: true,
              headerLeft: CustomHeaderLeft,
            }}
          />
          <Stack.Screen
            name="broker/brokerDetail"
            options={{
              title: "Aracı Detayı",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="broker/sections/salesSection"
            options={{
              title: "Satış İşlemleri",
              headerShown: true,
              headerBackVisible: false,
              gestureEnabled: false,
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name="broker/sections/collectionSection"
            options={{
              title: "Tahsilat İşlemleri",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="broker/sections/statementSection"
            options={{
              title: "Ekstreler",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="broker/sections/invoiceSection"
            options={{
              title: "Faturalar",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="categories"
            options={{
              title: "Kategori Yönetimi",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="broker/sections/confirmSales"
            options={{
              title: "Satış Onayı",
              headerShown: true,
              headerBackVisible: false, // Geri butonu gizle
              gestureEnabled: false, // iOS'ta swipe ile geri gitmeyi engelle
              headerLeft: () => null, // Header sol tarafını tamamen temizle
            }}
          />
          <Stack.Screen
            name="stockDetail"
            options={{
              title: "Stok Detayı",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="broker/sections/resultSales"
            options={{
              title: "Satış Tamamlandı",
              headerShown: true,
              headerBackVisible: false, // Geri butonu gizle
              gestureEnabled: false, // iOS'ta swipe ile geri gitmeyi engelle
              headerLeft: () => null, // Header sol tarafını tamamen temizle
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
