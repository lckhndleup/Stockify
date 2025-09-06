// src/types/payment.ts

// Backend'den gelen payment response (swagger'a göre)
export interface PaymentResponse {
  firstName: string;
  lastName: string;
  paymentPrice: number;
  downloadURL: string;
}

// Payment save request body (swagger'a göre)
export interface PaymentSaveRequest {
  brokerId: number;
  paymentPrice: number;
  paymentType: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "CHECK";
}

// UI'da kullanılan payment form data
export interface PaymentFormData {
  amount: number;
  paymentType: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "CHECK";
}

// Payment type seçenekleri (UI için)
export const PAYMENT_TYPE_OPTIONS = [
  { label: "Nakit", value: "CASH" },
  { label: "Kredi Kartı", value: "CREDIT_CARD" },
  { label: "Havale/EFT", value: "BANK_TRANSFER" },
  { label: "Çek", value: "CHECK" },
];

// Payment type labels
export const PAYMENT_TYPE_LABELS = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı",
  BANK_TRANSFER: "Havale/EFT",
  CHECK: "Çek",
};
