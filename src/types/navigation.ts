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
  onPress?: () => void;
}

export type AppRoute = "/" | "/stock" | "/brokers" | "/products";

export interface NavigationItem {
  icon: {
    family:
      | "MaterialIcons"
      | "MaterialCommunityIcons"
      | "Feather"
      | "AntDesign"
      | "Ionicons";
    name: string;
  };
  label: string;
  path: AppRoute;
}

export interface BottomNavigationProps {
  className?: string;
}
