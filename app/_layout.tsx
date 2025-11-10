// app/_layout.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity } from "react-native";
import { router, usePathname } from "expo-router";
import Providers from "@/src/components/common/Providers";
import GlobalToast from "@/src/components/common/GlobalToast";
import { setAuthStoreRef } from "@/src/services/authBridge";
// Initialize i18n translations globally
import "@/src/utils/i18n";
import { BottomNavigation, Icon } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";
import { useAuthErrorHandler } from "@/src/hooks/api";
import logger from "@/src/utils/logger";
import type { RouteParams, CustomHeaderLeftProps } from "@/src/types/navigation";
import "../global.css";

const CustomHeaderLeft = ({
  targetRoute = "/",
  routeParams = {},
  iconName = "arrow-back",
  iconColor = "#000",
  isGoBack = false,
  onPress,
}: CustomHeaderLeftProps) => {
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }

    if (isGoBack && router.canGoBack()) {
      router.back();
      return;
    } else if (Object.keys(routeParams).length > 0) {
      router.push({ pathname: targetRoute as any, params: routeParams });
    } else {
      router.push(targetRoute as any);
    }
  }, [targetRoute, routeParams, onPress, isGoBack]);

  return (
    <TouchableOpacity onPress={handlePress} style={{ marginLeft: -5 }} activeOpacity={0.95}>
      <Icon family="MaterialIcons" name={iconName as any} size={24} color={iconColor} />
    </TouchableOpacity>
  );
};

export default function RootLayout() {
  const authStore = useAuthStore();
  const { isAuthenticated, initializeAuth } = authStore;
  const { initializeErrorHandler } = useAuthErrorHandler();
  const pathname = usePathname();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // 👈 DÜZELTİLDİ: Error handler initialization flag
  const errorHandlerInitialized = useRef(false);
  const authInitialized = useRef(false);

  // ✅ Navigation ready setup - SADECE BİR KERE
  useEffect(() => {
    const isDevMode = process.env.NODE_ENV === "development";
    if (isDevMode) logger.debug("📱 RootLayout mounted");

    const timer = setTimeout(() => {
      setIsNavigationReady(true);
      if (isDevMode) logger.debug("✅ Navigation ready");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Error handler setup - SADECE BİR KERE
  useEffect(() => {
    if (!errorHandlerInitialized.current && isNavigationReady) {
      const isDevMode = process.env.NODE_ENV === "development";
      if (isDevMode) logger.debug("🔧 Setting up global auth error handler...");

      initializeErrorHandler(authStore);
      // Bridge auth store to services layer (401 handler in apiService)
      try {
        setAuthStoreRef(authStore as any);
      } catch {
        // noop
      }
      errorHandlerInitialized.current = true;

      if (isDevMode) logger.debug("✅ Global auth error handler setup completed");
    }
  }, [isNavigationReady, authStore, initializeErrorHandler]);

  // ✅ Auth initialization - SADECE BİR KERE
  useEffect(() => {
    if (isNavigationReady && !authInitialized.current) {
      const isDevMode = process.env.NODE_ENV === "development";
      if (isDevMode) logger.debug("🔄 Starting auth initialization...");

      initializeAuth().catch((err) => {
        logger.error("❌ Auth initialization failed:", err);
      });
      authInitialized.current = true;
    }
  }, [isNavigationReady, initializeAuth]);

  // ✅ Bottom navigation visibility logic
  const shouldShowBottomNav = useMemo(
    () =>
      isAuthenticated &&
      pathname !== "/login" &&
      pathname !== "/" &&
      !pathname.includes("/broker/sections/"),
    [isAuthenticated, pathname],
  );

  // ✅ Optimized logging - sadece development mode'da
  if (process.env.NODE_ENV === "development") {
    logger.debug("🎯 RootLayout render:", {
      pathname,
      isAuthenticated,
      shouldShowBottomNav,
      isNavigationReady,
    });
  }

  // ✅ Memoized header components - Performance optimization
  const brokerDetailHeaderLeft = useCallback(() => <CustomHeaderLeft targetRoute="/brokers" />, []);

  const homeHeaderLeft = useCallback(
    () => <CustomHeaderLeft targetRoute="/dashboard" isGoBack />,
    [],
  );

  const productsHeaderLeft = useCallback(
    () => <CustomHeaderLeft targetRoute="/products" isGoBack />,
    [],
  );

  const stockHeaderLeft = useCallback(() => <CustomHeaderLeft targetRoute="/stock" />, []);

  return (
    <Providers>
      <StatusBar style="auto" hidden={true} />
      <GlobalToast />
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
          {/* Splash Screens */}
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          {/* Auth Screens */}
          <Stack.Screen
            name="login"
            options={{
              title: "Giriş",
              headerShown: false,
            }}
          />

          {/* Main Screens */}
          <Stack.Screen
            name="dashboard"
            options={{
              title: "Envantra",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="products"
            options={{
              title: "Ürünler",
              headerShown: true,
              headerLeft: homeHeaderLeft,
            }}
          />

          <Stack.Screen
            name="brokers"
            options={{
              title: "Aracılar",
              headerShown: true,
              headerLeft: homeHeaderLeft,
            }}
          />

          <Stack.Screen
            name="profile/index"
            options={{
              title: "Profil",
              headerShown: true,
              headerLeft: homeHeaderLeft,
            }}
          />

          <Stack.Screen
            name="stock/index"
            options={{
              title: "Stok Takip",
              headerShown: true,
              headerLeft: homeHeaderLeft,
            }}
          />

          <Stack.Screen
            name="categories"
            options={{
              title: "Kategori Yönetimi",
              headerShown: true,
              headerLeft: productsHeaderLeft,
            }}
          />

          <Stack.Screen
            name="stockDetail"
            options={{
              title: "Stok Detayı",
              headerShown: true,
              headerLeft: stockHeaderLeft,
            }}
          />

          {/* Broker Detail */}
          <Stack.Screen
            name="broker/brokerDetail"
            options={{
              title: "Aracı Detayı",
              headerShown: true,
              headerLeft: brokerDetailHeaderLeft,
            }}
          />

          {/* Broker Sections */}
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
            options={({ route }) => ({
              title: "Tahsilat İşlemleri",
              headerShown: true,
              headerLeft: () => (
                <CustomHeaderLeft
                  targetRoute="/broker/brokerDetail"
                  routeParams={{
                    brokerId: (route.params as RouteParams)?.brokerId,
                  }}
                />
              ),
            })}
          />

          <Stack.Screen
            name="broker/sections/statementSection"
            options={({ route }) => ({
              title: "Ekstreler",
              headerShown: true,
              headerLeft: () => (
                <CustomHeaderLeft
                  targetRoute="/broker/brokerDetail"
                  routeParams={{
                    brokerId: (route.params as RouteParams)?.brokerId,
                  }}
                />
              ),
            })}
          />

          <Stack.Screen
            name="broker/sections/invoiceSection"
            options={({ route }) => ({
              title: "Faturalar",
              headerShown: true,
              headerLeft: () => (
                <CustomHeaderLeft
                  targetRoute="/broker/brokerDetail"
                  routeParams={{
                    brokerId: (route.params as RouteParams)?.brokerId,
                  }}
                />
              ),
            })}
          />

          <Stack.Screen
            name="broker/sections/confirmSales"
            options={{
              title: "Satış Onayı",
              headerShown: true,
              headerBackVisible: false,
              gestureEnabled: false,
              headerLeft: () => null,
            }}
          />

          <Stack.Screen
            name="broker/sections/resultSales"
            options={{
              title: "Satış Tamamlandı",
              headerShown: true,
              headerBackVisible: false,
              gestureEnabled: false,
              headerLeft: () => null,
            }}
          />

          <Stack.Screen
            name="broker/sections/collectionResult"
            options={{
              title: "Tahsilat Tamamlandı",
              headerShown: true,
              headerBackVisible: false,
              gestureEnabled: false,
              headerLeft: () => null,
            }}
          />
        </Stack>

        {/* ✅ Bottom Navigation */}
        {shouldShowBottomNav && <BottomNavigation className="absolute bottom-10 left-2 right-2" />}
      </View>
    </Providers>
  );
}
