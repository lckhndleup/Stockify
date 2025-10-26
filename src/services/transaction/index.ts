// -------------------- Transaction --------------------

import { request } from "../base";
import { TransactionRequest, TransactionResponse } from "./type";

enum TransactionEndpoint {
  GET_ALL = "/transaction/all",
}

/** GET /transaction/all */
const getTransactions = async (params: TransactionRequest): Promise<TransactionResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("brokerId", params.brokerId.toString());
  queryParams.append("startDate", params.startDate.toString());
  queryParams.append("endDate", params.endDate.toString());

  const queryString = queryParams.toString();
  const url = `${TransactionEndpoint.GET_ALL}?${queryString}`;

  const result = await request<TransactionResponse>(url, {
    method: "GET",
  });

  return result;
};

export { getTransactions };
