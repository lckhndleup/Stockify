/**
 * @deprecated Bu dosya artık kullanılmamaktadır.
 * Belge görüntüleme işlemleri için DocumentModal komponenti kullanılmaktadır.
 *
 * @see /src/components/ui/documentModal.tsx
 *
 * Kullanım:
 * import { DocumentModal } from "@/src/components/ui";
 *
 * <DocumentModal
 *   visible={visible}
 *   onClose={() => setVisible(false)}
 *   documentUrl={url}
 *   title="Belge Başlığı"
 *   headers={getAuthHeaders()}
 * />
 */

import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';
import WebView from "react-native-webview";
import { Container, Button, Icon, Typography, Divider } from "@/src/components/ui";
import { getAuthHeaders } from "@/src/services/base";

export default function DocumentViewer() {
  const route = useRoute<RouteProp<RootStackParamList, 'BrokerDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = route.params as any;
  const urlParam = params.url as string | undefined;
  const titleParam = params.title as string | undefined;
  const [shouldShowLoader, setShouldShowLoader] = useState(true);

  const headers = useMemo(
    () => ({
      Accept: "application/pdf",
      ...getAuthHeaders(),
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
          onPress: () => navigation.goBack(),
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
          onPress={() => navigation.goBack()}
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
