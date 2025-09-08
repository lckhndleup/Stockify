// src/validations/saleValidations.ts
// SalesController validasyonları: /sales/products, /sales/calculate, /sales/confirm, /sales/cancel
import { z } from "zod";

/* ----------------------------- Ortak alanlar ----------------------------- */
export const brokerIdSchema = z.coerce
  .number()
  .int("brokerId tam sayı olmalıdır")
  .positive("brokerId 0'dan büyük olmalıdır");

export const createInvoiceSchema = z.coerce
  .boolean()
  .refine((val) => val !== undefined, {
    message: "createInvoice zorunludur",
  })
  .refine((val) => typeof val === "boolean", {
    message: "createInvoice boolean olmalıdır",
  });

/* ---------------------- Body: calculate/confirm/cancel ------------------- */
// Gövde hepsi için aynı: { brokerId, createInvoice }
export const salesActionSchema = z.object({
  brokerId: brokerIdSchema,
  createInvoice: createInvoiceSchema,
});

// Alias (hepsi aynı gövdeyi kullanıyor)
export const salesCalculateSchema = salesActionSchema;
export const salesConfirmSchema = salesActionSchema;
export const salesCancelSchema = salesActionSchema;

export type SalesActionInput = z.infer<typeof salesActionSchema>;
export type SalesCalculateInput = z.infer<typeof salesCalculateSchema>;
export type SalesConfirmInput = z.infer<typeof salesConfirmSchema>;
export type SalesCancelInput = z.infer<typeof salesCancelSchema>;

/* ----------------------- GET /sales/products (response) ------------------ */
// Daha önce yazdığın products validasyonu burada:
export const salesProductItemSchema = z.object({
  productId: z.number().int(),
  productName: z.string().min(1),
  productCount: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100),
});

export const salesProductsResponseSchema = z.array(salesProductItemSchema);
export type SalesProductItem = z.infer<typeof salesProductItemSchema>;
export type SalesProductsResponse = z.infer<typeof salesProductsResponseSchema>;

/* --------------------------- Sales summary (response) -------------------- */
// (Swagger şemasına göre – confirm/calculate döner)
export const salesItemSchema = z.object({
  salesId: z.number().int().optional(),
  productId: z.number().int(),
  productName: z.string(),
  productCount: z.number().int(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  taxRate: z.number(),
  taxPrice: z.number(),
  totalPriceWithTax: z.number(),
});

export const salesSummarySchema = z.object({
  documentNumber: z.string().optional(),
  salesItems: z.array(salesItemSchema),
  subtotalPrice: z.number(),
  discountPrice: z.number(),
  discountRate: z.number(),
  totalPrice: z.number(),
  taxPrice: z.number(),
  totalPriceWithTax: z.number(),
  downloadUrl: z.string().url().optional(),
});
export type SalesItem = z.infer<typeof salesItemSchema>;
export type SalesSummary = z.infer<typeof salesSummarySchema>;

/* ----------------------------- Parse yardımcıları ------------------------ */
export const parseSalesAction = (input: unknown): SalesActionInput => {
  const r = salesActionSchema.safeParse(input);
  if (!r.success) throw r.error;
  return r.data;
};

export const parseSalesProducts = (input: unknown): SalesProductsResponse => {
  const r = salesProductsResponseSchema.safeParse(input);
  if (!r.success) throw r.error;
  return r.data;
};

export const parseSalesSummary = (input: unknown): SalesSummary => {
  const r = salesSummarySchema.safeParse(input);
  if (!r.success) throw r.error;
  return r.data;
};
