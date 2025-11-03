// src/validations/basketValidation.ts
// Basket validasyonları: GET /sales/basket/{brokerId}, POST /basket/{add|remove|update}
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

/* ----------------------------- POST /basket/update ----------------------- */
// Body: { brokerId, productId, productCount }
export const updateBasketSchema = z.object({
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

/* ------------------------------ Tipler & Helpers ------------------------- */
export type AddToBasketInput = z.infer<typeof addToBasketSchema>;
export type RemoveFromBasketInput = z.infer<typeof removeFromBasketSchema>;
export type UpdateBasketInput = z.infer<typeof updateBasketSchema>;
export type BrokerIdParam = z.infer<typeof brokerIdParamSchema>;

export const parseAddToBasket = (input: unknown): AddToBasketInput => {
  const result = addToBasketSchema.safeParse(input);
  if (!result.success) throw result.error;
  return result.data;
};

export const parseRemoveFromBasket = (input: unknown): RemoveFromBasketInput => {
  const result = removeFromBasketSchema.safeParse(input);
  if (!result.success) throw result.error;
  return result.data;
};

export const parseUpdateBasket = (input: unknown): UpdateBasketInput => {
  const result = updateBasketSchema.safeParse(input);
  if (!result.success) throw result.error;
  return result.data;
};
