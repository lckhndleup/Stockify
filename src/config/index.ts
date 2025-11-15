// src/config/index.ts
// React Native CLI compatible configuration
import { API_URL, API_TIMEOUT_MS } from '@env';

export const Config = {
  API_URL: API_URL || "http://50.114.185.206:8080",
  API_TIMEOUT_MS: API_TIMEOUT_MS ? Number(API_TIMEOUT_MS) : 60000,
  IS_DEV: __DEV__,
};

export default Config;
