// src/validations/brokerValidation.ts

import { z } from "zod";

// Broker ekleme form validasyonu
export const brokerSchema = z.object({
  firstName: z
    .string()
    .min(1, "Ad zorunludur")
    .min(2, "Ad en az 2 karakter olmalıdır")
    .max(50, "Ad en fazla 50 karakter olabilir")
    .trim(),
  lastName: z
    .string()
    .min(1, "Soyad zorunludur")
    .min(2, "Soyad en az 2 karakter olmalıdır")
    .max(50, "Soyad en fazla 50 karakter olabilir")
    .trim(),
  discountRate: z
    .number()
    .min(0, "İskonto oranı 0'dan küçük olamaz")
    .max(100, "İskonto oranı 100'den büyük olamaz"),
});

// Broker güncelleme form validasyonu
export const editBrokerSchema = z.object({
  firstName: z
    .string()
    .min(1, "Ad zorunludur")
    .min(2, "Ad en az 2 karakter olmalıdır")
    .max(50, "Ad en fazla 50 karakter olabilir")
    .trim(),
  lastName: z
    .string()
    .min(1, "Soyad zorunludur")
    .min(2, "Soyad en az 2 karakter olmalıdır")
    .max(50, "Soyad en fazla 50 karakter olabilir")
    .trim(),
  discountRate: z
    .number()
    .min(0, "İskonto oranı 0'dan küçük olamaz")
    .max(100, "İskonto oranı 100'den büyük olamaz"),
});

// Discount rate güncelleme validasyonu
export const discountRateSchema = z.object({
  discountRate: z
    .number()
    .min(0, "İskonto oranı 0'dan küçük olamaz")
    .max(100, "İskonto oranı 100'den büyük olamaz"),
});

// Basit validation fonksiyonları (UI formları için)
export const validateBrokerForm = (
  firstName: string,
  lastName: string,
  discountRate: string,
  email: string,
  vkn: string,
) => {
  const errors: Record<string, string> = {};

  if (!firstName.trim()) {
    errors.firstName = "Ad zorunludur";
  } else if (firstName.trim().length < 2) {
    errors.firstName = "Ad en az 2 karakter olmalıdır";
  } else if (firstName.trim().length > 50) {
    errors.firstName = "Ad en fazla 50 karakter olabilir";
  }

  if (!lastName.trim()) {
    errors.lastName = "Soyad zorunludur";
  } else if (lastName.trim().length < 2) {
    errors.lastName = "Soyad en az 2 karakter olmalıdır";
  } else if (lastName.trim().length > 50) {
    errors.lastName = "Soyad en fazla 50 karakter olabilir";
  }

  if (!email.trim()) {
    errors.email = "Email zorunludur";
  } else if (email.trim().length < 2) {
    errors.email = "Email en az 2 karakter olmalıdır";
  } else if (email.trim().length > 50) {
    errors.email = "Email en fazla 50 karakter olabilir";
  }

  if (!vkn.trim()) {
    errors.vkn = "VKN zorunludur";
  } else if (vkn.trim().length < 2) {
    errors.vkn = "VKN en az 2 karakter olmalıdır";
  } else if (vkn.trim().length > 50) {
    errors.vkn = "VKN en fazla 50 karakter olabilir";
  }

  if (!discountRate.trim()) {
    errors.discountRate = "İskonto oranı zorunludur";
  } else if (
    isNaN(Number(discountRate)) ||
    Number(discountRate) < 0 ||
    Number(discountRate) > 100
  ) {
    errors.discountRate = "İskonto oranı 0-100 arası olmalıdır";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// Discount rate validation
export const validateDiscountRate = (discountRate: string) => {
  const errors: Record<string, string> = {};

  if (!discountRate.trim()) {
    errors.discountRate = "İskonto oranı zorunludur";
  } else if (
    isNaN(Number(discountRate)) ||
    Number(discountRate) < 0 ||
    Number(discountRate) > 100
  ) {
    errors.discountRate = "İskonto oranı 0-100 arası olmalıdır";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export type BrokerFormData = z.infer<typeof brokerSchema>;
export type EditBrokerFormData = z.infer<typeof editBrokerSchema>;
export type DiscountRateFormData = z.infer<typeof discountRateSchema>;
