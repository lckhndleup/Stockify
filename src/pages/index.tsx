// app/index.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Typography } from '@/src/components/ui';
import { useAuthStore } from '@/src/stores/authStore';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';

export default function HomePage() {
  const authStore = useAuthStore();
  const { isAuthenticated } = authStore;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ✅ Auth kontrolü - Route değişikliklerinde
  useEffect(() => {
    setTimeout(() => {
      if (!isAuthenticated) {
        navigation.replace('Login');
      } else {
        navigation.replace('Dashboard');
      }
    }, 1000);
  }, [isAuthenticated, navigation]);

  return (
    <Container
      className="bg-stock-red justify-center items-center"
      padding="sm"
    >
      <Typography
        variant="h1"
        weight="bold"
        size="xl"
        className="text-stock-white"
      >
        Envantra
      </Typography>
      <ActivityIndicator size="large" color="#FFFFFF" className="my-4" />
    </Container>
  );
}
