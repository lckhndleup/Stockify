// src/types/report.ts
import type { BrokerVisitInfo } from "./broker";

// Daily Report Request Types
export interface DailyReportRequest {
  brokerId?: number; // Optional: if provided, returns report for specific broker
  startDate?: number; // Optional: epoch timestamp
  endDate?: number; // Optional: epoch timestamp
}

// Daily Report Response Types - NEW MODEL
export interface DailyDetail {
  date: number; // epoch timestamp
  salesAmount: number;
  paymentAmount: number;
  profitOrLoss: number;
  visitInfo?: BrokerVisitInfo | null;
}

export interface DailyBrokerReport {
  orderNo: number;
  brokerFullName: string;
  dailyDetails: DailyDetail[];
  totalSalesAmount: number;
  totalPaymentAmount: number;
  profitOrLoss: number;
}

export interface DailySummaryReport {
  date: number; // epoch timestamp
  totalSalesAmount: number;
  totalPaymentAmount: number;
  profitOrLoss: number;
}

export interface ReportTotals {
  totalSalesAmount: number;
  totalPaymentAmount: number;
  profitOrLoss: number;
}

export interface DailyReportResponse {
  dailyBrokerReports: DailyBrokerReport[];
  dailySummaryReports: DailySummaryReport[];
  totals: ReportTotals;
}

// Display types for UI
export interface DailyReportDisplayItem {
  orderNo: number;
  brokerName: string;
  totalSales: string; // Formatted currency
  totalPayment: string; // Formatted currency
  profitOrLoss: string; // Formatted currency
  isProfitable: boolean;
  dailyDetailsCount: number;
}

export interface DailySummaryDisplayItem {
  date: string; // Formatted date
  salesAmount: string;
  paymentAmount: string;
  profitOrLoss: string;
  isProfitable: boolean;
}

// Legacy type for components (alias to DailyBrokerReport)
export interface DailyReportItem {
  brokerId: number;
  brokerName: string;
  totalSales: number;
  totalCollection: number;
  totalDebt: number;
  transactionCount: number;
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const formatShortDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
};

// Adapter functions
export const adaptBrokerReportForUI = (report: DailyBrokerReport): DailyReportDisplayItem => ({
  orderNo: report.orderNo,
  brokerName: report.brokerFullName,
  totalSales: formatCurrency(report.totalSalesAmount),
  totalPayment: formatCurrency(report.totalPaymentAmount),
  profitOrLoss: formatCurrency(Math.abs(report.profitOrLoss)),
  isProfitable: report.profitOrLoss >= 0,
  dailyDetailsCount: report.dailyDetails.length,
});

export const adaptSummaryReportForUI = (report: DailySummaryReport): DailySummaryDisplayItem => ({
  date: formatShortDate(report.date),
  salesAmount: formatCurrency(report.totalSalesAmount),
  paymentAmount: formatCurrency(report.totalPaymentAmount),
  profitOrLoss: formatCurrency(Math.abs(report.profitOrLoss)),
  isProfitable: report.profitOrLoss >= 0,
});
