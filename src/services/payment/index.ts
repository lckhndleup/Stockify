import { request } from "../base";
import logger from "@/src/utils/logger";

export const savePayment = async (payment: {
  brokerId: number;
  paymentPrice: number;
  paymentType: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "CHECK";
}): Promise<any> => {
  try {
    logger.debug("💰 API: Saving payment:", payment);

    const result = await request<any>("/payment/save", {
      method: "POST",
      body: JSON.stringify(payment),
    });

    logger.debug("✅ API: Payment saved:", result ? Object.keys(result) : "null");

    return result;
  } catch (error) {
    logger.error("💰 API: Payment save error:", error);
    throw error;
  }
};
