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

export type SalesQuantityInput = z.infer<typeof salesQuantitySchema>;
export type SalesProductInput = z.infer<typeof salesProductSchema>;
export type EditQuantityInput = z.infer<typeof editQuantitySchema>;
