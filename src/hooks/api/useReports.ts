// src/hooks/api/useReports.ts
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/src/services/api";
import logger from "@/src/utils/logger";
import { queryKeys } from "./queryKeys";
import type { DailyReportResponse } from "@/src/types/report";

// Daily Report Hook
export const useDailyReport = (
  params?: {
    brokerId?: number;
    startDate?: number;
    endDate?: number;
  },
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: queryKeys.reports.daily(params),
    queryFn: async () => {
      logger.debug("📊 Fetching daily report...", params);
      const result = await apiService.getDailyReport(params);
      logger.debug("✅ Daily report fetched:", result);
      return result as DailyReportResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Hook for specific broker's daily report
export const useBrokerDailyReport = (
  brokerId: number,
  params?: {
    startDate?: number;
    endDate?: number;
  },
  options?: { enabled?: boolean },
) => {
  return useDailyReport(
    {
      brokerId,
      ...params,
    },
    options,
  );
};
