import React, { useEffect, useRef } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@/src/stores/authStore";
import { setNavigationRef } from "@/src/services/authBridge";
import { useAuthErrorHandler } from "@/src/hooks/api";
import Providers from "@/src/components/common/Providers";
import GlobalToast from "@/src/components/common/GlobalToast";
import "@/src/utils/i18n";

// Pages
import HomePage from "../pages/index";
import LoginPage from "../pages/login";
import DashboardPage from "../pages/dashboard";
import BrokersPage from "../pages/brokers";
import ProductsPage from "../pages/products";
import ProfilePage from "../pages/profile";
import BrokerDetailPage from "../pages/broker/brokerDetail";
import CategoriesPage from "../pages/categories";
import StockPage from "../pages/stock";
import StockDetailPage from "../pages/stockDetail";
import ReportsPage from "../pages/reports";
import BrokerVisitsPage from "../pages/broker-visits";
import SalesSection from "../pages/broker/sections/salesSection";
import CollectionSection from "../pages/broker/sections/collectionSection";
import StatementSection from "../pages/broker/sections/statementSection";
import ConfirmSales from "../pages/broker/sections/confirmSales";
import ResultSales from "../pages/broker/sections/resultSales";

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Dashboard: undefined;
  Brokers: undefined;
  Products: undefined;
  Profile: undefined;
  Stock: undefined;
  Categories: undefined;
  StockDetail: { id: string; action?: string; amount?: number };
  BrokerDetail: { 
    brokerId: string;
    [key: string]: any; // Allow additional params for sections
  };
  BrokerVisits: undefined;
  Reports: undefined;
  SalesSection: { brokerId: string };
  CollectionSection: { brokerId: string };
  StatementSection: { brokerId: string };
  ConfirmSales: {
    brokerId: string;
    salesData?: string; // JSON stringified sales items
    createInvoice?: string; // "true" | "false"
    [key: string]: any; // Allow future extension
  };
  ResultSales: {
    brokerId: string;
    success?: string; // "true" | "false"
    totalAmount?: string;
    discountAmount?: string;
    createInvoice?: string; // "true" | "false"
    documentNumber?: string;
    downloadUrl?: string;
    summaryJSON?: string;
    [key: string]: any;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const authStore = useAuthStore();
  const { initializeAuth } = authStore;
  const { initializeErrorHandler } = useAuthErrorHandler();
  const authInitialized = useRef(false);

  // Set navigation ref for authBridge
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, []);

  // Initialize error handler
  useEffect(() => {
    initializeErrorHandler(authStore);
  }, [authStore, initializeErrorHandler]);

  // Initialize auth once
  useEffect(() => {
    if (!authInitialized.current) {
      initializeAuth();
      authInitialized.current = true;
    }
  }, [initializeAuth]);

  return (
    <Providers>
      <GlobalToast />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: "#fff",
            },
            headerTintColor: "#000",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen name="Home" component={HomePage} />
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen
            name="Dashboard"
            component={DashboardPage}
            options={{ title: "Dashboard" }}
          />
          <Stack.Screen
            name="Brokers"
            component={BrokersPage}
            options={{ title: "Aracılar", headerShown: true }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsPage}
            options={{ title: "Ürünler", headerShown: true }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfilePage}
            options={{ title: "Profil", headerShown: true }}
          />
          <Stack.Screen
            name="Categories"
            component={CategoriesPage}
            options={{ title: "Kategoriler", headerShown: true }}
          />
          <Stack.Screen
            name="Stock"
            component={StockPage}
            options={{ title: "Stok", headerShown: true }}
          />
          <Stack.Screen
            name="StockDetail"
            component={StockDetailPage}
            options={{ title: "Stok Detayı", headerShown: true }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsPage}
            options={{ title: "Raporlar", headerShown: true }}
          />
          <Stack.Screen
            name="BrokerVisits"
            component={BrokerVisitsPage}
            options={{ title: "Ziyaretler", headerShown: false }}
          />
          <Stack.Screen
            name="BrokerDetail"
            component={BrokerDetailPage}
            options={{ title: "Aracı Detay", headerShown: true }}
          />
          <Stack.Screen
            name="SalesSection"
            component={SalesSection}
            options={{ title: "Satış", headerShown: true }}
          />
          <Stack.Screen
            name="CollectionSection"
            component={CollectionSection}
            options={{ title: "Tahsilat", headerShown: true }}
          />
          <Stack.Screen
            name="StatementSection"
            component={StatementSection}
            options={{ title: "Ekstreler", headerShown: true }}
          />
          <Stack.Screen
            name="ConfirmSales"
            component={ConfirmSales}
            options={{ title: "Satış Onayı", headerShown: true }}
          />
          <Stack.Screen
            name="ResultSales"
            component={ResultSales}
            options={{ title: "Satış Sonucu", headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Providers>
  );
}
