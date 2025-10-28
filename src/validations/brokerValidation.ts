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
  email: z.string().email("Geçerli bir e-posta girin").max(100, "E-posta çok uzun"),
  vkn: z
    .string()
    .min(10, "VKN en az 10 haneli olmalıdır")
    .max(11, "VKN en fazla 11 haneli olabilir")
    .regex(/^\d+$/, "VKN sadece rakamlardan oluşmalıdır"),
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
  email: z.string().email("Geçerli bir e-posta girin").max(100, "E-posta çok uzun"),
  vkn: z
    .string()
    .min(10, "VKN en az 10 haneli olmalıdır")
    .max(11, "VKN en fazla 11 haneli olabilir")
    .regex(/^\d+$/, "VKN sadece rakamlardan oluşmalıdır"),
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
  email: string,
  vkn: string,
  discountRate: string,
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
    errors.email = "E-posta zorunludur";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Geçerli bir e-posta girin";
  }

  if (!vkn.trim()) {
    errors.vkn = "VKN zorunludur";
  } else if (!/^\d{10,11}$/.test(vkn.trim())) {
    errors.vkn = "VKN 10-11 haneli rakamlardan oluşmalıdır";
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
