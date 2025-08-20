import React, { useEffect, useRef } from "react";
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  Dimensions,
  ModalProps as RNModalProps,
  Animated,
  PanResponder,
  Platform,
  Easing,
} from "react-native";
import Typography from "./typography";
import Icon from "./icon";

const { height: screenHeight } = Dimensions.get("window");

interface BottomSheetProps extends RNModalProps {
  children: React.ReactNode;
  title?: string;
  visible: boolean;
  onClose: () => void;
  height?: "small" | "medium" | "large" | "full";
  showCloseButton?: boolean;
  overlayClosable?: boolean;
  className?: string;
}

export default function BottomSheet({
  children,
  title,
  visible,
  onClose,
  height = "medium",
  showCloseButton = true,
  overlayClosable = true,
  className = "",
  ...props
}: BottomSheetProps) {
  const heightClasses = {
    small: screenHeight * 0.5, // 50% ekran
    medium: screenHeight * 0.85, // 85% ekran - daha fazla içerik sığdırmak için artırıldı
    large: screenHeight * 0.9, // 90% ekran
    full: screenHeight * 0.95, // 95% ekran
  };

  const sheetHeight = heightClasses[height];

  // Animation values
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Pan gesture for drag to dismiss - GELİŞTİRİLMİŞ
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Aşağı doğru sürükleme için eşik değeri düşük tutuyoruz
        return Math.abs(gestureState.dy) > 2;
      },
      onPanResponderMove: (_, gestureState) => {
        // Sadece aşağı doğru hareketleri izliyoruz (yukarı değil)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Eğer belirli bir mesafeden fazla aşağı çekildiyse, kapat
        if (gestureState.dy > sheetHeight * 0.15 || gestureState.vy > 0.5) {
          closeBottomSheet();
        } else {
          // Yeterli mesafe değilse, geri eski konumuna gönder
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const openBottomSheet = () => {
    // Daha doğal hissettiren animasyon
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150, // Daha hızlı
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65, // Daha doğal bir açılma
        friction: 10, // Daha az zıplama etkisi
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeBottomSheet = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150, // Biraz daha yumuşak geçiş
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 200, // Biraz daha yumuşak kapanış
        useNativeDriver: true,
        easing: Easing.out(Easing.ease), // Daha doğal bir kapanış eğrisi
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      opacity.setValue(0);
      openBottomSheet();
    }
  }, [visible]);

  const handleOverlayPress = () => {
    if (overlayClosable) {
      closeBottomSheet();
    }
  };

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none" // Custom animation kullanıyoruz
      statusBarTranslucent
      onRequestClose={closeBottomSheet}
      {...props}
    >
      {/* Overlay */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: opacity,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleOverlayPress}
        >
          <View style={{ flex: 1 }} />
        </TouchableOpacity>

        {/* BottomSheet Content - TÜM ALAN DRAG'LANABİLİR */}
        <Animated.View
          style={{
            height: sheetHeight,
            transform: [{ translateY }],
            backgroundColor: "#FFFEFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
            }),
          }}
        >
          {/* Header Area - Bu alan kaydırılabilir */}
          <View
            {...panResponder.panHandlers} // PanResponder'ı header'a ekliyoruz
            style={{
              paddingTop: 12,
              paddingHorizontal: 24,
              paddingBottom: title ? 8 : 12,
            }}
          >
            {/* Handle Bar */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 4,
                  backgroundColor: "#ECECEC",
                  borderRadius: 2,
                }}
              />
            </View>

            {/* Header */}
            {(title || showCloseButton) && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ECECEC",
                }}
              >
                {title && (
                  <Typography
                    variant="h4"
                    className="flex-1 text-stock-dark"
                    weight="semibold"
                  >
                    {title}
                  </Typography>
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={closeBottomSheet}
                    style={{
                      marginLeft: 16,
                      padding: 8,
                      borderRadius: 20,
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      family="MaterialIcons"
                      name="close"
                      size={24}
                      color="#6D706F"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Content */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: Platform.OS === "ios" ? 34 : 16,
            }}
          >
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}
