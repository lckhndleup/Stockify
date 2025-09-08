// src/validations/basketValidations.ts
// Basket validasyonları: GET /sales/basket/{brokerId}, POST /basket/add, POST /basket/remove
import { z } from "zod";

/* ----------------------------- Ortak alanlar ----------------------------- */
export const brokerIdParamSchema = z.coerce
  .number()
  .int("brokerId tam sayı olmalıdır")
  .positive("brokerId 0'dan büyük olmalıdır");

/* ------------------------------- POST /basket/add ------------------------ */
// Body: { brokerId, productId, productCount }
export const addToBasketSchema = z.object({
  brokerId: brokerIdParamSchema,
  productId: z.coerce
    .number()
    .int("productId tam sayı olmalıdır")
    .positive("productId 0'dan büyük olmalıdır"),
  productCount: z.coerce
    .number()
    .int("productCount tam sayı olmalıdır")
    .positive("productCount 0'dan büyük olmalıdır"),
});

/* ----------------------------- POST /basket/remove ----------------------- */
// Body: { brokerId, productId }
export const removeFromBasketSchema = z.object({
  brokerId: brokerIdParamSchema,
  productId: z.coerce
    .number()
    .int("productId tam sayı olmalıdır")
    .positive("productId 0'dan büyük olmalıdır"),
});

/* ------------------------------ Tipler & Helpers ------------------------- */
export type AddToBasketInput = z.infer<typeof addToBasketSchema>;
export type RemoveFromBasketInput = z.infer<typeof removeFromBasketSchema>;
export type BrokerIdParam = z.infer<typeof brokerIdParamSchema>;

export const parseAddToBasket = (input: unknown): AddToBasketInput => {
  const r = addToBasketSchema.safeParse(input);
  if (!r.success) throw r.error;
  return r.data;
};

export const parseRemoveFromBasket = (
  input: unknown
): RemoveFromBasketInput => {
  const r = removeFromBasketSchema.safeParse(input);
  if (!r.success) throw r.error;
  return r.data;
};
