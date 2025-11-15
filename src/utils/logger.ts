/* eslint-disable no-console */
// src/utils/logger.ts
// Lightweight logger gated by __DEV__ and configurable log level

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

function getInitialLevel(): LogLevel {
  return __DEV__ ? "debug" : "error";
}

let currentLevel: LogLevel = getInitialLevel();

export const setLogLevel = (level: LogLevel) => {
  currentLevel = level;
};

const levelPriority: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

function shouldLog(level: LogLevel) {
  return levelPriority[level] <= levelPriority[currentLevel] && currentLevel !== "silent";
}

function prefix(scope?: string) {
  return scope ? `[${scope}]` : "";
}

const logger = {
  debug: (msg?: any, ...optionalParams: any[]) => {
    if (__DEV__ && shouldLog("debug")) console.debug(msg, ...optionalParams);
  },
  info: (msg?: any, ...optionalParams: any[]) => {
    if (__DEV__ && shouldLog("info")) console.info(msg, ...optionalParams);
  },
  warn: (msg?: any, ...optionalParams: any[]) => {
    if (shouldLog("warn")) console.warn(msg, ...optionalParams);
  },
  error: (msg?: any, ...optionalParams: any[]) => {
    if (shouldLog("error")) console.error(msg, ...optionalParams);
  },
  scoped: (scope: string) => ({
    debug: (msg?: any, ...optionalParams: any[]) =>
      logger.debug(prefix(scope), msg, ...optionalParams),
    info: (msg?: any, ...optionalParams: any[]) =>
      logger.info(prefix(scope), msg, ...optionalParams),
    warn: (msg?: any, ...optionalParams: any[]) =>
      logger.warn(prefix(scope), msg, ...optionalParams),
    error: (msg?: any, ...optionalParams: any[]) =>
      logger.error(prefix(scope), msg, ...optionalParams),
  }),
  setLevel: setLogLevel,
};

export default logger;
