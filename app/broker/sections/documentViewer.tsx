import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import WebView from "react-native-webview";
import { Container, Button, Icon, Typography, Divider } from "@/src/components/ui";
import apiService from "@/src/services/api";

export default function DocumentViewer() {
  const params = useLocalSearchParams();
  const urlParam = params.url as string | undefined;
  const titleParam = params.title as string | undefined;
  const [shouldShowLoader, setShouldShowLoader] = useState(true);

  const headers = useMemo(
    () => ({
      Accept: "application/pdf",
      ...apiService.getAuthHeaders(),
    }),
    [],
  );

  const docUrl = useMemo(() => urlParam ?? "", [urlParam]);
  const docTitle = titleParam ?? "Belge";

  useEffect(() => {
    if (!docUrl) {
      Alert.alert("Hata", "Gösterilecek belge bulunamadı.", [
        {
          text: "Tamam",
          onPress: () => router.back(),
        },
      ]);
    }
  }, [docUrl]);

  if (!docUrl) {
    return null;
  }

  return (
    <Container className="bg-white" padding="sm" safeTop>
      <View className="flex-row items-center mb-3">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          leftIcon={<Icon family="MaterialIcons" name="arrow-back" size={22} color="#111" />}
          className="px-2"
        >
          <Typography className="text-stock-dark">Geri</Typography>
        </Button>
        <Typography weight="bold" className="text-stock-dark flex-1 text-center mr-10">
          {docTitle}
        </Typography>
      </View>
      <Divider className="mb-2" />
      <View className="flex-1 overflow-hidden rounded-lg border border-stock-border">
        <WebView
          source={{ uri: docUrl, headers }}
          onLoadEnd={() => setShouldShowLoader(false)}
          startInLoadingState
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#E3001B" />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setShouldShowLoader(false);
            Alert.alert("Hata", nativeEvent.description || "Belge yüklenemedi.");
          }}
          style={{ flex: 1 }}
        />
        {shouldShowLoader && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator size="large" color="#E3001B" />
          </View>
        )}
      </View>
    </Container>
  );
}
