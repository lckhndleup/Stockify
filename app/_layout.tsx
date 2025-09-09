// app/_layout.tsx
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity } from "react-native";
import { router, usePathname, useRouter } from "expo-router";
import Providers from "@/src/components/common/Providers";
import { BottomNavigation, Icon } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";
import "../global.css";

// ✅ GELİŞTİRİLMİŞ Custom Header Left Component
interface CustomHeaderLeftProps {
  targetRoute?: string;
  routeParams?: Record<string, any>;
  title?: string;
  iconName?: string;
  iconColor?: string;
  onPress?: () => void; // Custom action için
}

const CustomHeaderLeft = ({
  targetRoute = "/",
  routeParams = {},
  title = "Geri",
  iconName = "arrow-back",
  iconColor = "#000",
  onPress,
}: CustomHeaderLeftProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (Object.keys(routeParams).length > 0) {
      router.push({ pathname: targetRoute as any, params: routeParams });
    } else {
      router.push(targetRoute as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ marginLeft: -5 }}
      activeOpacity={0.7}
    >
      <Icon
        family="MaterialIcons"
        name={iconName as any}
        size={24}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

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

  // Login sayfasında ve sections altında BottomNavigation gösterme
  const shouldShowBottomNav =
    isAuthenticated &&
    pathname !== "/login" &&
    !pathname.includes("/broker/sections/");

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
              headerLeft: () => <CustomHeaderLeft targetRoute="/" />,
            }}
          />
          <Stack.Screen
            name="brokers"
            options={{
              title: "Aracılar",
              headerShown: true,
              headerLeft: () => <CustomHeaderLeft targetRoute="/" />,
            }}
          />
          <Stack.Screen
            name="stock"
            options={{
              title: "Stok Takip",
              headerShown: true,
              headerLeft: () => <CustomHeaderLeft targetRoute="/" />,
            }}
          />
          {/* ✅ GÜNCELLENECEK: brokerDetail için /brokers'a gidecek */}
          <Stack.Screen
            name="broker/brokerDetail"
            options={{
              title: "Aracı Detayı",
              headerShown: true,
              headerLeft: () => <CustomHeaderLeft targetRoute="/brokers" />,
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
            options={({ route }) => ({
              title: "Tahsilat İşlemleri",
              headerShown: true,
              // ✅ collectionSection'da brokerDetail'a geri dön
              headerLeft: () => (
                <CustomHeaderLeft
                  targetRoute="/broker/brokerDetail"
                  routeParams={{ brokerId: (route.params as any)?.brokerId }}
                />
              ),
            })}
          />
          <Stack.Screen
            name="broker/sections/statementSection"
            options={({ route }) => ({
              title: "Ekstreler",
              headerShown: true,
              // ✅ statementSection'da brokerDetail'a geri dön
              headerLeft: () => (
                <CustomHeaderLeft
                  targetRoute="/broker/brokerDetail"
                  routeParams={{ brokerId: (route.params as any)?.brokerId }}
                />
              ),
            })}
          />
          <Stack.Screen
            name="broker/sections/invoiceSection"
            options={({ route }) => ({
              title: "Faturalar",
              headerShown: true,
              // ✅ invoiceSection'da brokerDetail'a geri dön
              headerLeft: () => (
                <CustomHeaderLeft
                  targetRoute="/broker/brokerDetail"
                  routeParams={{ brokerId: (route.params as any)?.brokerId }}
                />
              ),
            })}
          />
          <Stack.Screen
            name="categories"
            options={{
              title: "Kategori Yönetimi",
              headerShown: true,
              // ✅ categories sayfasından products'a geri dön
              headerLeft: () => <CustomHeaderLeft targetRoute="/products" />,
            }}
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
            name="stockDetail"
            options={{
              title: "Stok Detayı",
              headerShown: true,
              // ✅ stockDetail'dan stock'a geri dön
              headerLeft: () => <CustomHeaderLeft targetRoute="/stock" />,
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
        </Stack>

        {/* BottomNavigation sadece login olmamış kullanıcılarda göster */}
        {shouldShowBottomNav && (
          <BottomNavigation className="absolute bottom-10 left-2 right-2" />
        )}
      </View>
    </Providers>
  );
}
