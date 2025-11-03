// Transaction API Types
export interface TransactionRequest {
  brokerId: number;
  startDate: number;
  endDate: number;
}

export interface TransactionItem {
  firstName: string;
  lastName: string;
  price: number;
  balance: number;
  type: "SALE" | "PAYMENT";
  downloadDocumentUrl: string;
  createdDate: number;
  paymentType: "CASH" | "CREDIT_CARD" | "CARD" | "BANK_TRANSFER" | "CHECK" | "OTHER";
  requestedInvoice: boolean;
}

export interface TransactionSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface TransactionPageable {
  offset: number;
  sort: TransactionSort;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

export interface TransactionResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: TransactionItem[];
  number: number;
  sort: TransactionSort;
  pageable: TransactionPageable;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
