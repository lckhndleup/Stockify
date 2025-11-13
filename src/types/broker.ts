// src/types/broker.ts

// Backend'den gelen broker verisi (Swagger: BrokerDto)
import type { Role } from "./apiTypes";

export const BROKER_TARGET_DAY_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type BrokerTargetDay = (typeof BROKER_TARGET_DAY_VALUES)[number];

// Broker Visit Status
export type BrokerVisitStatus = "VISITED" | "NOT_VISITED" | "SKIPPED";

// Broker Visit Info (Backend response)
export interface BrokerVisitInfo {
  creatorUserId: number;
  brokerId: number;
  visitDate: number; // epoch timestamp
  status: BrokerVisitStatus;
  note?: string;
}

export interface Broker {
  brokerId: number;
  brokerUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role | string; // backend string döndürüyor; Role union ile uyumlu bırakıldı
  vkn: string;
  tkn: string;
  currentBalance: number;
  discountRate: number;
  status: "ACTIVE" | "PASSIVE";
  createdDate: number; // epoch (int64)
  lastModifiedDate: number; // epoch (int64)
  targetDayOfWeek: BrokerTargetDay;
  orderNo?: number; // Broker visit order
  visitInfo?: BrokerVisitInfo; // Visit information
}

// UI'da kullanılan broker verisi (mevcut UI uyumlu)
export interface BrokerDisplayItem {
  id: string;
  name: string;
  surname: string; // UI'da surname kullanılıyor
  email?: string;
  vkn?: string;
  tkn?: string;
  discountRate: number;
  balance: number; // currentBalance'dan geliyor
  isActive: boolean;
  createdDate: string;
  targetDayOfWeek?: BrokerTargetDay;
  orderNo?: number; // Visit order number
  visitInfo?: BrokerVisitInfo; // Visit information
}

// Broker ekleme formu
export interface BrokerFormData {
  firstName: string;
  lastName: string;
  email: string;
  vkn: string;
  tkn: string;
  discountRate: number;
  targetDayOfWeek: BrokerTargetDay;
}

// Broker güncelleme formu
export interface BrokerUpdateData {
  brokerId: number;
  firstName: string;
  lastName: string;
  email: string;
  vkn: string;
  tkn: string;
  discountRate: number;
  targetDayOfWeek: BrokerTargetDay;
}

// Broker discount rate güncelleme
export interface BrokerDiscountRateUpdateData {
  brokerId: number;
  discountRate: number;
}

// Broker Order Update
export interface BrokerOrderUpdateData {
  brokerId: number;
  orderNo: number;
}

// Today's Broker Visit Item (Backend response)
export interface TodayBrokerVisitItem {
  creatorUserId: number;
  brokerId: number;
  brokerUserId: number;
  orderNo: number;
  firstName: string;
  lastName: string;
  email: string;
  currentBalance: number;
  discountRate: number;
  status: "ACTIVE" | "PASSIVE";
  targetDayOfWeek: BrokerTargetDay;
  visitInfo?: BrokerVisitInfo;
  createdDate: number; // epoch timestamp
  lastModifiedDate: number; // epoch timestamp
}

// UI'da kullanılan broker visit item
export interface BrokerVisitDisplayItem {
  brokerId: number;
  brokerName: string;
  targetDayOfWeek: BrokerTargetDay;
  visitInfo?: BrokerVisitInfo;
  orderNo: number;
  email?: string;
  currentBalance?: number;
  discountRate?: number;
}

// Backend response'u UI format'ına çevir
export const adaptBrokerVisitForUI = (item: TodayBrokerVisitItem): BrokerVisitDisplayItem => ({
  brokerId: item.brokerId,
  brokerName: `${item.firstName} ${item.lastName}`,
  targetDayOfWeek: item.targetDayOfWeek,
  visitInfo: item.visitInfo,
  orderNo: item.orderNo,
  email: item.email,
  currentBalance: item.currentBalance,
  discountRate: item.discountRate,
});

// Broker Visit Update Request
export interface BrokerVisitUpdateRequest {
  brokerId: number;
  status: BrokerVisitStatus;
  note?: string;
}

// Backend'den gelen veriyi UI format'ına çevir
export const adaptBrokerForUI = (broker: Broker): BrokerDisplayItem => ({
  id: broker.brokerId.toString(),
  name: broker.firstName,
  surname: broker.lastName, // Backend lastName -> UI surname
  email: broker.email,
  vkn: broker.vkn,
  tkn: broker.tkn,
  discountRate: broker.discountRate,
  balance: broker.currentBalance,
  isActive: broker.status === "ACTIVE",
  createdDate: new Date(broker.createdDate).toISOString(),
  targetDayOfWeek: broker.targetDayOfWeek,
  orderNo: broker.orderNo,
  visitInfo: broker.visitInfo,
});

// UI form'undan backend format'ına çevir
export const adaptBroker = (formData: BrokerFormData) => ({
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  email: formData.email.trim(),
  vkn: formData.vkn.trim(),
  tkn: formData.tkn.trim(),
  discountRate: formData.discountRate,
  targetDayOfWeek: formData.targetDayOfWeek,
});

// Update için backend format'ına çevir
export const adaptBrokerUpdate = (
  brokerId: number,
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    vkn: string;
    tkn: string;
    discountRate: number;
    targetDayOfWeek: BrokerTargetDay;
  },
): BrokerUpdateData => ({
  brokerId,
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  email: formData.email.trim(),
  vkn: formData.vkn.trim(),
  discountRate: formData.discountRate,
  tkn: formData.tkn.trim(),
  targetDayOfWeek: formData.targetDayOfWeek,
});

// Request types (Swagger names)
export type BrokerCreateRequest = BrokerFormData;
export type BrokerUpdateRequest = BrokerUpdateData;
