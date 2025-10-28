// src/types/broker.ts

// Backend'den gelen broker verisi (Swagger: BrokerDto)
import type { Role } from "./apiTypes";

export interface Broker {
  brokerId: number;
  brokerUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role | string; // backend string döndürüyor; Role union ile uyumlu bırakıldı
  vkn: string;
  currentBalance: number;
  discountRate: number;
  status: "ACTIVE" | "PASSIVE";
  createdDate: number; // epoch (int64)
  lastModifiedDate: number; // epoch (int64)
}

// UI'da kullanılan broker verisi (mevcut UI uyumlu)
export interface BrokerDisplayItem {
  id: string;
  name: string;
  surname: string; // UI'da surname kullanılıyor
  email?: string;
  vkn?: string;
  discountRate: number;
  balance: number; // currentBalance'dan geliyor
  isActive: boolean;
  createdDate: string;
}

// Broker ekleme formu
export interface BrokerFormData {
  firstName: string;
  lastName: string;
  email: string;
  vkn: string;
  discountRate: number;
}

// Broker güncelleme formu
export interface BrokerUpdateData {
  brokerId: number;
  firstName: string;
  lastName: string;
  email: string;
  vkn: string;
  discountRate: number;
}

// Broker discount rate güncelleme
export interface BrokerDiscountRateUpdateData {
  brokerId: number;
  discountRate: number;
}

// Backend'den gelen veriyi UI format'ına çevir
export const adaptBrokerForUI = (broker: Broker): BrokerDisplayItem => ({
  id: broker.brokerId.toString(),
  name: broker.firstName,
  surname: broker.lastName, // Backend lastName -> UI surname
  email: broker.email,
  vkn: broker.vkn,
  discountRate: broker.discountRate,
  balance: broker.currentBalance,
  isActive: broker.status === "ACTIVE",
  createdDate: new Date(broker.createdDate).toISOString(),
});

// UI form'undan backend format'ına çevir
export const adaptBroker = (formData: BrokerFormData) => ({
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  email: formData.email.trim(),
  vkn: formData.vkn.trim(),
  discountRate: formData.discountRate,
});

// Update için backend format'ına çevir
export const adaptBrokerUpdate = (
  brokerId: number,
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    vkn: string;
    discountRate: number;
  },
): BrokerUpdateData => ({
  brokerId,
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  email: formData.email.trim(),
  vkn: formData.vkn.trim(),
  discountRate: formData.discountRate,
});

// Request types (Swagger names)
export type BrokerCreateRequest = BrokerFormData;
export type BrokerUpdateRequest = BrokerUpdateData;
