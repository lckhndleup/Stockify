// src/validations/salesValidation.ts
import { z } from "zod";

export const salesQuantitySchema = z.object({
  quantity: z
    .string()
    .min(1, "Adet girilmesi zorunludur")
    .refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz")
    .refine((val) => Number(val) > 0, "Adet 0'dan büyük olmalıdır")
    .refine((val) => Number.isInteger(Number(val)), "Adet tam sayı olmalıdır")
    .refine((val) => Number(val) <= 10000, "Adet 10.000'den küçük olmalıdır"),
});

export const salesProductSchema = z.object({
  productId: z.string().min(1, "Ürün seçimi zorunludur"),
  quantity: z.number().min(1, "Adet 1'den büyük olmalıdır"),
});

export const editQuantitySchema = z.object({
  quantity: z
    .string()
    .min(1, "Adet girilmesi zorunludur")
    .refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz")
    .refine((val) => Number(val) > 0, "Adet 0'dan büyük olmalıdır")
    .refine((val) => Number.isInteger(Number(val)), "Adet tam sayı olmalıdır"),
});

// YENİ: Kategori Validasyon Şemaları
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Kategori adı girilmesi zorunludur")
    .min(2, "Kategori adı en az 2 karakter olmalıdır")
    .max(50, "Kategori adı en fazla 50 karakter olabilir")
    .refine((val) => val.trim().length > 0, "Kategori adı boş olamaz"),
  taxRate: z
    .string()
    .min(1, "KDV oranı girilmesi zorunludur")
    .refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz")
    .refine((val) => Number(val) >= 0, "KDV oranı 0'dan küçük olamaz")
    .refine((val) => Number(val) <= 100, "KDV oranı 100'den büyük olamaz")
    .refine(
      (val) =>
        Number(val) % 1 === 0 ||
        Number(val).toString().split(".")[1]?.length <= 2,
      "KDV oranı en fazla 2 ondalık basamak olabilir"
    ),
});

export const editCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Kategori adı girilmesi zorunludur")
    .min(2, "Kategori adı en az 2 karakter olmalıdır")
    .max(50, "Kategori adı en fazla 50 karakter olabilir")
    .refine((val) => val.trim().length > 0, "Kategori adı boş olamaz"),
  taxRate: z
    .string()
    .min(1, "KDV oranı girilmesi zorunludur")
    .refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz")
    .refine((val) => Number(val) >= 0, "KDV oranı 0'dan küçük olamaz")
    .refine((val) => Number(val) <= 100, "KDV oranı 100'den büyük olamaz")
    .refine(
      (val) =>
        Number(val) % 1 === 0 ||
        Number(val).toString().split(".")[1]?.length <= 2,
      "KDV oranı en fazla 2 ondalık basamak olabilir"
    ),
});

// Ürün validasyon şemasına kategori zorunluluğu eklendi
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Ürün adı girilmesi zorunludur")
    .min(2, "Ürün adı en az 2 karakter olmalıdır")
    .max(100, "Ürün adı en fazla 100 karakter olabilir")
    .refine((val) => val.trim().length > 0, "Ürün adı boş olamaz"),
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  stock: z
    .string()
    .min(1, "Stok adedi girilmesi zorunludur")
    .refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz")
    .refine((val) => Number(val) >= 0, "Stok adedi 0'dan küçük olamaz")
    .refine(
      (val) => Number.isInteger(Number(val)),
      "Stok adedi tam sayı olmalıdır"
    )
    .refine(
      (val) => Number(val) <= 100000,
      "Stok adedi 100.000'den küçük olmalıdır"
    ),
  price: z
    .string()
    .min(1, "Fiyat girilmesi zorunludur")
    .refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz")
    .refine((val) => Number(val) > 0, "Fiyat 0'dan büyük olmalıdır")
    .refine(
      (val) => Number(val) <= 1000000,
      "Fiyat 1.000.000'den küçük olmalıdır"
    )
    .refine(
      (val) =>
        Number(val) % 1 === 0 ||
        Number(val).toString().split(".")[1]?.length <= 2,
      "Fiyat en fazla 2 ondalık basamak olabilir"
    ),
});

export type SalesQuantityInput = z.infer<typeof salesQuantitySchema>;
export type SalesProductInput = z.infer<typeof salesProductSchema>;
export type EditQuantityInput = z.infer<typeof editQuantitySchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type EditCategoryInput = z.infer<typeof editCategorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
