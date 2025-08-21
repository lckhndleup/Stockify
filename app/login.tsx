import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import BackgroundSvg from "@/src/components/svg/backgorundsvg";

import {
  Container,
  Typography,
  Input,
  Button,
  Icon,
  Checkbox,
} from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert("Hata", "Lütfen kullanıcı adınızı girin.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Hata", "Lütfen şifrenizi girin.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    // Login attempt
    const success = await login(username, password, rememberMe);

    if (success) {
      // Direkt ana sayfaya yönlendir
      router.replace("/");
    } else {
      Alert.alert(
        "Giriş Hatası",
        "Kullanıcı adı veya şifre hatalı.\n\nDeneyebileceğiniz hesaplar:\n• admin / 123456\n• stockify / password\n• test / test123"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Container className="bg-white" padding="none" safeTop={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Background with Real SVG - Üst Kısım */}
          <View className="relative" style={{ height: 280 }}>
            {/* Gerçek SVG Background */}
            <BackgroundSvg width={undefined} height={280} />

            {/* Logo/Title Overlay */}
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ paddingBottom: 60 }}
            >
              <Typography
                variant="h1"
                size="4xl"
                weight="bold"
                className="text-stock-white mb-2"
              >
                Stockify
              </Typography>
            </View>
          </View>

          {/* Login Form */}
          <View className="flex-1 px-6 pt-8 pb-6" style={{ minHeight: 400 }}>
            {/* Welcome Text */}
            <View className="mb-8">
              <Typography
                variant="h3"
                weight="bold"
                className="text-stock-dark mb-2"
                align="center"
              >
                Hoş Geldiniz
              </Typography>
              <Typography
                variant="body"
                className="text-stock-text"
                align="center"
              >
                Hesabınıza giriş yapın
              </Typography>
            </View>

            {/* Form Inputs */}
            <View className="mb-6">
              {/* Username Input */}
              <Input
                label="Kullanıcı Adı"
                value={username}
                onChangeText={setUsername}
                placeholder="Kullanıcı adınızı girin"
                variant="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={
                  <Icon
                    family="MaterialIcons"
                    name="person"
                    size={20}
                    color="#6D706F"
                  />
                }
                className="mb-4"
              />

              {/* Password Input */}
              <Input
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                placeholder="Şifrenizi girin"
                variant="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={
                  <Icon
                    family="MaterialIcons"
                    name="lock"
                    size={20}
                    color="#6D706F"
                  />
                }
                rightIcon={
                  <Icon
                    family="MaterialIcons"
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#6D706F"
                    pressable
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                className="mb-4"
              />

              {/* Remember Me Checkbox */}
              <View className="flex-row items-center justify-between mb-6">
                <Checkbox
                  checked={rememberMe}
                  onToggle={setRememberMe}
                  label="Beni hatırla"
                  size="md"
                />
              </View>
            </View>

            {/* Login Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-stock-red mb-4"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            >
              <Typography className="text-white" weight="semibold">
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Typography>
            </Button>

            {/* Demo Credentials Info */}
            <View className="bg-stock-gray p-4 rounded-lg">
              <Typography
                variant="caption"
                className="text-stock-dark mb-2"
                weight="medium"
                align="center"
              >
                Demo Hesapları:
              </Typography>
              <Typography
                variant="caption"
                size="xs"
                className="text-stock-text"
                align="center"
              >
                admin / 123456 • stockify / password • test / test123
              </Typography>
            </View>
          </View>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  );
}
