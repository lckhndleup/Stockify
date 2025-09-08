import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Typography, Card, Icon, Button } from "@/src/components/ui";
import { useAuthStore } from "@/src/stores/authStore";
import apiService from "@/src/services/api";

export default function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, token, isAuthenticated, rememberMe } = useAuthStore();

  const testAPIConnection = async () => {
    try {
      console.log("🧪 Testing API connection...");

      // Test endpoints
      const tests = [
        {
          name: "Health Check",
          test: () => fetch("https://stockify-gcsq.onrender.com"),
        },
        {
          name: "Products Search",
          test: () => apiService.getProducts(),
        },
      ];

      for (const { name, test } of tests) {
        try {
          console.log(`🔍 Testing ${name}...`);
          const result = await test();
          console.log(`✅ ${name} successful:`, result);
        } catch (error) {
          console.log(`❌ ${name} failed:`, error);
        }
      }
    } catch (error) {
      console.error("🚨 API test failed:", error);
    }
  };

  const tokenInfo = token
    ? {
        length: token.length,
        preview: token.substring(0, 30) + "...",
        isBearer: token.startsWith("Bearer") || token.includes("."),
        parts: token.split(".").length, // JWT typically has 3 parts
      }
    : null;

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        className="bg-blue-50 border border-blue-200 rounded-lg p-3"
      >
        <View className="flex-row items-center justify-between">
          <Typography variant="body" className="text-blue-700" weight="medium">
            🔧 Debug Panel{" "}
            {isAuthenticated ? "(Authenticated)" : "(Not Authenticated)"}
          </Typography>
          <Icon
            family="MaterialIcons"
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color="#1e40af"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <Card className="mt-2 bg-gray-50 border border-gray-200" padding="sm">
          <View className="space-y-3">
            {/* Auth Status */}
            <View>
              <Typography
                variant="caption"
                weight="bold"
                className="text-gray-700 mb-2"
              >
                Authentication Status:
              </Typography>
              <Typography variant="caption" className="text-gray-600">
                • Authenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}
              </Typography>
              <Typography variant="caption" className="text-gray-600">
                • Remember Me: {rememberMe ? "✅ Yes" : "❌ No"}
              </Typography>
              <Typography variant="caption" className="text-gray-600">
                • Username: {user?.username || "None"}
              </Typography>
            </View>

            {/* Token Info */}
            <View>
              <Typography
                variant="caption"
                weight="bold"
                className="text-gray-700 mb-2"
              >
                Token Information:
              </Typography>
              {tokenInfo ? (
                <>
                  <Typography variant="caption" className="text-gray-600">
                    • Length: {tokenInfo.length} characters
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    • Preview: {tokenInfo.preview}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    • JWT Parts: {tokenInfo.parts}{" "}
                    {tokenInfo.parts === 3 ? "✅" : "❌"}
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" className="text-gray-600">
                  • No token available
                </Typography>
              )}
            </View>

            {/* API Connection Test */}
            <View>
              <Typography
                variant="caption"
                weight="bold"
                className="text-gray-700 mb-2"
              >
                API Tests:
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onPress={testAPIConnection}
                className="border-blue-300"
              >
                <Typography className="text-blue-600" size="sm">
                  Test API Connection
                </Typography>
              </Button>
            </View>

            {/* Console Tip */}
            <View className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <Typography variant="caption" className="text-yellow-700">
                💡 Console'u açın (F12) ve login/logout işlemlerini takip edin!
              </Typography>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}
