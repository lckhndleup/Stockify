const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// JSON dosyalarını asset olarak ele al (Lottie vb.) ve sourceExts'den çıkar
config.resolver.assetExts = [...config.resolver.assetExts, "json"];
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== "json"
);

// CSS dosyaları için (NativeWind)
config.resolver.sourceExts = [
  ...new Set([...config.resolver.sourceExts, "css"]),
];

// Src klasörü için watchFolders
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
