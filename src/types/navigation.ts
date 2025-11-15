// Navigation ve routing ile ilgili type tanımları

export interface RouteParams {
  brokerId?: string;
  [key: string]: any;
}

export interface CustomHeaderLeftProps {
  targetRoute?: string;
  routeParams?: RouteParams;
  iconName?: string;
  iconColor?: string;
  isGoBack?: boolean;
  onPress?: () => void;
}

export type AppRoute =
  | "/dashboard"
  | "/stock"
  | "/brokers"
  | "/products"
  | "/broker-visits"
  | "/reports";

export interface NavigationItem {
  icon: {
    family: "MaterialIcons" | "MaterialCommunityIcons" | "Feather" | "AntDesign" | "Ionicons";
    name: string;
  };
  label: string;
  path: AppRoute;
  routeName: string;
}

export interface BottomNavigationProps {
  className?: string;
}
