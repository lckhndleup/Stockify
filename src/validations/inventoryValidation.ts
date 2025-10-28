// src/validations/inventoryValidation.ts
import { z } from "zod";

export const inventoryFormSchema = z
  .object({
    price: z.coerce
      .number()
      .refine((v) => !Number.isNaN(v), {
        message: "Fiyat geçerli bir sayı olmalı",
      })
      .gt(0, { message: "Fiyat 0'dan büyük olmalıdır" }),
    productCount: z.coerce
      .number()
      .refine((v) => !Number.isNaN(v), {
        message: "Ürün adedi geçerli bir sayı olmalı",
      })
      .int({ message: "Ürün adedi tam sayı olmalıdır" })
      .min(0, { message: "Ürün adedi 0'dan küçük olamaz" }),
    criticalProductCount: z.coerce
      .number()
      .refine((v) => !Number.isNaN(v), {
        message: "Kritik ürün adedi geçerli bir sayı olmalı",
      })
      .int({ message: "Kritik ürün adedi tam sayı olmalıdır" })
      .min(0, { message: "Kritik ürün adedi 0'dan küçük olamaz" }),
  })
  .refine((data) => data.productCount >= data.criticalProductCount, {
    path: ["productCount"],
    message: "Ürün adedi kritik ürün adedinden küçük olamaz",
  });

export type InventoryFormInput = z.infer<typeof inventoryFormSchema>;

export const parseInventoryForm = (input: unknown): InventoryFormInput => {
  const result = inventoryFormSchema.safeParse(input);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
};
