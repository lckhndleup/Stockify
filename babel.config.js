module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // NativeWind için gerekli plugin'ler
      "react-native-reanimated/plugin", // En sonda olmalı
    ],
  };
};
