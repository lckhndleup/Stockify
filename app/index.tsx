// app/index.tsx
import React, { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Container, Typography } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";

export default function HomePage() {
  const authStore = useAuthStore();
  const { isAuthenticated } = authStore;

  // ✅ Auth kontrolü - Route değişikliklerinde
  useEffect(() => {
    setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
      } else {
        router.replace("/dashboard");
      }
    }, 1000);
  }, []);

  return (
    <Container className="bg-stock-red justify-center items-center" padding="sm">
      <Typography variant="h1" weight="bold" size="xl" className="text-stock-white">
        Envantra
      </Typography>
      <ActivityIndicator size="large" color="#FFFFFF" className="my-4" />
    </Container>
  );
}
