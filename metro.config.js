const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// JSON dosyaları için resolver ayarı
config.resolver.assetExts.push("json");

// Src klasörü için watchFolders
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, { input: "./global.css" });
