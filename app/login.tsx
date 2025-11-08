// app/login.tsx
import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import BackgroundSvg from "@/src/components/svg/backgorundsvg";

import { Container, Typography, Input, Button, Icon, Checkbox } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";
import { useAppStore } from "@/src/stores/appStore";
import { loginFormSchema } from "@/src/validations/authValidation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const { login, isLoading, clearError } = useAuthStore();
  const { showGlobalToast, hideGlobalToast } = useAppStore();

  const handleUsernameChange = (value: string) => {
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
    setUsername(value);
  };

  const handlePasswordChange = (value: string) => {
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    setPassword(value);
  };

  const handleLogin = async () => {
    clearError();
    hideGlobalToast();

    const validation = loginFormSchema.safeParse({ username, password, rememberMe });

    if (!validation.success) {
      const { fieldErrors } = validation.error.flatten();
      const firstMessage =
        fieldErrors.username?.[0] || fieldErrors.password?.[0] || "Lütfen formu kontrol edin.";

      setErrors({
        username: fieldErrors.username?.[0],
        password: fieldErrors.password?.[0],
      });

      showGlobalToast(firstMessage, "error");
      return;
    }

    setErrors({});

    const {
      username: validUsername,
      password: validPassword,
      rememberMe: rememberFlag,
    } = validation.data;

    setUsername(validUsername);

    const success = await login(validUsername, validPassword, rememberFlag ?? rememberMe);

    if (success) {
      hideGlobalToast();
      router.replace("/");
      return;
    }

    const { error: authError } = useAuthStore.getState();
    const errorMessage = authError || "Giriş başarısız.";
    showGlobalToast(errorMessage, "error");
    clearError();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Container className="bg-white" padding="none" safeTop={false}>
        {/* Toast Notification handled globally */}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* Background with Real SVG - Üst Kısım */}
          <View className="relative" style={{ height: 220 }}>
            {/* Gerçek SVG Background */}
            <BackgroundSvg width={undefined} height={220} />

            {/* Logo/Title Overlay */}
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ paddingBottom: 40 }}
            >
              <Typography variant="h1" size="4xl" weight="bold" className="text-stock-white mb-2">
                Envantra
              </Typography>
            </View>
          </View>

          {/* Login Form */}
          <View className="flex-1 px-6 pt-2 pb-6" style={{ minHeight: 400 }}>
            {/* Welcome Text */}
            <View className="mb-6">
              <Typography
                variant="h3"
                weight="bold"
                className="text-stock-dark mb-2"
                align="center"
              >
                Hoş Geldiniz
              </Typography>
              <Typography variant="body" className="text-stock-text" align="center">
                Hesabınıza giriş yapın
              </Typography>
            </View>

            {/* Form Inputs */}
            <View className="mb-6">
              {/* Username Input */}
              <Input
                label="Kullanıcı Adı"
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Kullanıcı adınızı girin"
                variant="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.username}
                leftIcon={<Icon family="MaterialIcons" name="person" size={20} color="#6D706F" />}
                className="mb-4"
              />

              {/* Password Input */}
              <Input
                label="Şifre"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Şifrenizi girin"
                variant="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.password}
                leftIcon={<Icon family="MaterialIcons" name="lock" size={20} color="#6D706F" />}
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
              className="bg-stock-red"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            >
              <Typography className="text-white" weight="semibold">
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Typography>
            </Button>
          </View>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  );
}
