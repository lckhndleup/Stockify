// src/types/broker.ts

// Backend'den gelen broker verisi
export interface BackendBroker {
  brokerId: number;
  firstName: string;
  lastName: string;
  currentBalance: number;
  discountRate: number;
  status: "ACTIVE" | "PASSIVE";
  createdDate: number;
  lastModifiedDate: number;
}

// UI'da kullanılan broker verisi (mevcut arayüz uyumlu)
export interface BrokerDisplayItem {
  id: string;
  name: string;
  surname: string; // Arayüzde surname kullanılıyor
  email: string; // UI'da var ama backend'de yok, boş string olacak
  phone: string; // UI'da var ama backend'de yok, boş string olacak
  address: string; // UI'da var ama backend'de yok, boş string olacak
  discountRate: number;
  balance: number; // currentBalance'dan geliyor
  isActive: boolean;
  createdDate: string;
}

// Broker ekleme formu
export interface BrokerFormData {
  firstName: string;
  lastName: string;
  discountRate: number;
}

// Broker güncelleme formu
export interface BrokerUpdateData {
  brokerId: number;
  firstName: string;
  lastName: string;
  discountRate: number;
}

// Broker discount rate güncelleme
export interface BrokerDiscountRateUpdateData {
  brokerId: number;
  discountRate: number;
}

// Backend'den gelen veriyi UI format'ına çevir
export const adaptBrokerForUI = (broker: BackendBroker): BrokerDisplayItem => ({
  id: broker.brokerId.toString(),
  name: broker.firstName,
  surname: broker.lastName,
  email: "", // Backend'de email yok, boş string
  phone: "", // Backend'de phone yok, boş string
  address: "", // Backend'de address yok, boş string
  discountRate: broker.discountRate,
  balance: broker.currentBalance,
  isActive: broker.status === "ACTIVE",
  createdDate: new Date(broker.createdDate).toISOString(),
});

// UI form'undan backend format'ına çevir
export const adaptBrokerForBackend = (
  formData: BrokerFormData
): Omit<BrokerFormData, "id"> => ({
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  discountRate: formData.discountRate,
});

// Update için backend format'ına çevir
export const adaptBrokerUpdateForBackend = (
  brokerId: number,
  formData: { firstName: string; lastName: string; discountRate: number }
): BrokerUpdateData => ({
  brokerId,
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  discountRate: formData.discountRate,
});
