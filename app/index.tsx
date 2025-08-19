import React from "react";
import { Text, View, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-gray-50 justify-center items-center px-6">
      <View className="items-center mb-8">
        <Text className="text-6xl mb-4">📦</Text>
        <Text className="text-3xl font-bold text-gray-800 mt-4">Stockify</Text>
        <Text className="text-gray-600 text-center mt-2">
          Stok takibinizi kolaylaştıran uygulama
        </Text>
      </View>

      <TouchableOpacity className="bg-primary-600 px-8 py-4 rounded-lg">
        <Text className="text-white font-semibold text-lg">Başlayalım 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}
