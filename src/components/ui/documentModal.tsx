import React, { useEffect, useRef, useState } from "react";
import { Modal as RNModal, View, TouchableOpacity, Platform, Alert } from "react-native";
import WebView from "react-native-webview";
import LottieView from "lottie-react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import Typography from "./typography";
import Icon from "./icon";
import logger from "@/src/utils/logger";

interface DocumentModalProps {
  visible: boolean;
  onClose: () => void;
  documentUrl: string;
  title?: string;
  headers?: Record<string, string>;
}

export default function DocumentModal({
  visible,
  onClose,
  documentUrl,
  title = "Belge",
  headers = {},
}: DocumentModalProps) {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Loading animation ref
  const loadingAnimationRef = useRef<LottieView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Download document
  const handleDownload = async () => {
    try {
      setIsActionLoading(true);
      logger.debug("📥 Starting download:", documentUrl);

      const filename = `belge_${Date.now()}.pdf`;
      const file = new File(Paths.document, filename);

      // Use XMLHttpRequest to get binary data as ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", documentUrl, true);
        xhr.responseType = "arraybuffer";

        // Set headers
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response as ArrayBuffer);
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network request failed"));
        xhr.send();
      });

      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write as TypedArray
      await file.write(uint8Array);

      logger.debug("✅ Download successful:", file.uri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Show alert with share option
        Alert.alert("Başarılı", "Belge hazır! Kaydetmek veya paylaşmak ister misiniz?", [
          {
            text: "Paylaş/Kaydet",
            onPress: async () => {
              try {
                await Sharing.shareAsync(file.uri, {
                  mimeType: "application/pdf",
                  dialogTitle: title,
                  UTI: "com.adobe.pdf",
                });
              } catch (shareError) {
                logger.error("❌ Share after download error:", shareError);
              }
            },
          },
          {
            text: "Tamam",
            style: "cancel",
          },
        ]);
      } else {
        Alert.alert("Başarılı", "Belge başarıyla hazırlandı!");
      }
    } catch (error) {
      logger.error("❌ Download error:", error);
      Alert.alert("Hata", "Belge indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Share document
  const handleShare = async () => {
    try {
      setIsActionLoading(true);
      logger.debug("📤 Starting share:", documentUrl);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Uyarı", "Bu cihazda paylaşım özelliği kullanılamıyor.");
        return;
      }

      const filename = `belge_${Date.now()}.pdf`;
      const file = new File(Paths.document, filename);

      // Use XMLHttpRequest to get binary data
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", documentUrl, true);
        xhr.responseType = "arraybuffer";

        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response as ArrayBuffer);
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network request failed"));
        xhr.send();
      });

      const uint8Array = new Uint8Array(arrayBuffer);
      await file.write(uint8Array);

      logger.debug("✅ File ready for sharing:", file.uri);

      // Share the file - This will show native share sheet with all available apps
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: title,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      logger.error("❌ Share error:", error);
      Alert.alert("Hata", "Belge paylaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Print document
  const handlePrint = async () => {
    try {
      setIsActionLoading(true);
      logger.debug("🖨️ Starting print:", documentUrl);

      const filename = `belge_${Date.now()}.pdf`;
      const file = new File(Paths.document, filename);

      // Use XMLHttpRequest to get binary data
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", documentUrl, true);
        xhr.responseType = "arraybuffer";

        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response as ArrayBuffer);
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network request failed"));
        xhr.send();
      });

      const uint8Array = new Uint8Array(arrayBuffer);
      await file.write(uint8Array);

      logger.debug("✅ File ready for printing:", file.uri);

      // Open native print dialog
      const result = await Print.printAsync({
        uri: file.uri,
      });

      // Log result silently
      logger.debug("🖨️ Print result:", result);
    } catch (error: any) {
      // Just log errors, don't show any alerts to user
      logger.error("❌ Print error:", error);
    } finally {
      setIsActionLoading(false);
    }
  }; // Reset states when modal opens/closes
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setHasError(false);

      logger.debug("📄 Opening document:", documentUrl);
      logger.debug("📋 Headers:", headers);

      // Timeout - 10 saniye sonra hata göster
      const timeout = setTimeout(() => {
        logger.warn("⏱️ Document load timeout after 10 seconds");
        setIsLoading(false);
        setHasError(true);
      }, 10000);
      loadTimeoutRef.current = timeout;
    }

    // Cleanup
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [visible, documentUrl, headers]);

  // Loading animation loop
  useEffect(() => {
    if (isLoading && loadingAnimationRef.current) {
      const intervalId = setInterval(() => {
        loadingAnimationRef.current?.reset();
        loadingAnimationRef.current?.play();
      }, 1400);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);

  const handleClose = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <View className="flex-1 bg-black/60">
        {/* Modal Container - ~65% ekran yüksekliği */}
        <View className="flex-1 pt-32">
          <View
            className="flex-1 bg-white rounded-t-3xl overflow-hidden"
            style={{
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 12,
                },
              }),
            }}
          >
            {/* Header */}
            <View className="px-5 py-4 border-b border-stock-border bg-white">
              <View className="flex-row items-center justify-between">
                <Typography variant="h4" className="flex-1 text-stock-dark" weight="bold">
                  {title}
                </Typography>

                {/* Action Icons */}
                <View className="flex-row items-center gap-x-2">
                  {/* Download Icon */}
                  <TouchableOpacity
                    onPress={handleDownload}
                    disabled={isActionLoading || isLoading || hasError}
                    className="p-2 rounded-full bg-gray-100"
                    activeOpacity={0.7}
                    style={{
                      opacity: isActionLoading || isLoading || hasError ? 0.5 : 1,
                    }}
                  >
                    <Icon family="MaterialIcons" name="download" size={22} color="#374151" />
                  </TouchableOpacity>

                  {/* Share Icon */}
                  <TouchableOpacity
                    onPress={handleShare}
                    disabled={isActionLoading || isLoading || hasError}
                    className="p-2 rounded-full bg-gray-100"
                    activeOpacity={0.7}
                    style={{
                      opacity: isActionLoading || isLoading || hasError ? 0.5 : 1,
                    }}
                  >
                    <Icon family="MaterialIcons" name="share" size={22} color="#374151" />
                  </TouchableOpacity>

                  {/* Print Icon */}
                  <TouchableOpacity
                    onPress={handlePrint}
                    disabled={isActionLoading || isLoading || hasError}
                    className="p-2 rounded-full bg-gray-100"
                    activeOpacity={0.7}
                    style={{
                      opacity: isActionLoading || isLoading || hasError ? 0.5 : 1,
                    }}
                  >
                    <Icon family="MaterialIcons" name="print" size={22} color="#374151" />
                  </TouchableOpacity>

                  {/* Close Icon */}
                  <TouchableOpacity
                    onPress={handleClose}
                    className="p-2 rounded-full bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <Icon family="MaterialIcons" name="close" size={22} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* WebView Content */}
            <View className="flex-1 p-4">
              <View className="flex-1 rounded-xl border-2 border-stock-border bg-gray-50 overflow-hidden">
                {documentUrl ? (
                  <>
                    <WebView
                      source={{
                        uri: documentUrl,
                        headers: {
                          Accept: "application/pdf",
                          ...headers,
                        },
                      }}
                      onLoadEnd={() => {
                        logger.debug("✅ WebView Load End:", documentUrl);
                        if (loadTimeoutRef.current) {
                          clearTimeout(loadTimeoutRef.current);
                          loadTimeoutRef.current = null;
                        }
                        setIsLoading(false);
                      }}
                      onLoadStart={() => {
                        logger.debug("🔄 WebView Load Start:", documentUrl);
                        setIsLoading(true);
                        setHasError(false);
                      }}
                      onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        logger.error("❌ WebView Error:", nativeEvent);
                        if (loadTimeoutRef.current) {
                          clearTimeout(loadTimeoutRef.current);
                          loadTimeoutRef.current = null;
                        }
                        setIsLoading(false);
                        setHasError(true);
                      }}
                      onHttpError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        logger.error("🔴 HTTP Error:", nativeEvent.statusCode, nativeEvent.url);
                        if (loadTimeoutRef.current) {
                          clearTimeout(loadTimeoutRef.current);
                          loadTimeoutRef.current = null;
                        }
                        setIsLoading(false);
                        setHasError(true);
                      }}
                      startInLoadingState={false}
                      style={{ flex: 1, backgroundColor: "transparent" }}
                      scalesPageToFit={true}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      androidLayerType="hardware"
                      allowFileAccess={true}
                      allowUniversalAccessFromFileURLs={true}
                    />

                    {/* Loading Overlay */}
                    {isLoading && (
                      <View className="absolute inset-0 items-center justify-center bg-white">
                        <LottieView
                          ref={loadingAnimationRef}
                          source={require("../../assets/loadingAnimation.json")}
                          autoPlay={true}
                          loop={false}
                          speed={1}
                          onAnimationFinish={() => {
                            loadingAnimationRef.current?.reset();
                            loadingAnimationRef.current?.play();
                          }}
                          style={{
                            width: 120,
                            height: 120,
                          }}
                          resizeMode="contain"
                        />
                        <Typography variant="body" className="mt-4 text-stock-text" weight="medium">
                          Belge yükleniyor...
                        </Typography>
                      </View>
                    )}

                    {/* Error State */}
                    {hasError && !isLoading && (
                      <View className="absolute inset-0 items-center justify-center bg-white p-6">
                        <Icon
                          family="MaterialIcons"
                          name="error-outline"
                          size={64}
                          color="#EF4444"
                        />
                        <Typography
                          variant="h4"
                          className="mt-4 text-red-600 text-center"
                          weight="bold"
                        >
                          Belge Yüklenemedi
                        </Typography>
                        <Typography variant="body" className="mt-2 text-gray-600 text-center">
                          Belge görüntülenirken bir hata oluştu
                        </Typography>
                        <TouchableOpacity
                          onPress={() => {
                            setHasError(false);
                            setIsLoading(true);
                          }}
                          className="mt-6 bg-stock-red px-6 py-3 rounded-lg"
                          activeOpacity={0.8}
                        >
                          <Typography className="text-white" weight="bold">
                            Tekrar Dene
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <View className="flex-1 items-center justify-center p-6">
                    <Icon
                      family="MaterialIcons"
                      name="insert-drive-file"
                      size={64}
                      color="#9CA3AF"
                    />
                    <Typography variant="body" className="mt-4 text-gray-500 text-center">
                      Gösterilecek belge bulunamadı
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
