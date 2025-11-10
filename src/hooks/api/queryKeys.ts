// src/hooks/api/queryKeys.ts
export const queryKeys = {
  // Auth related
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    profile: () => [...queryKeys.auth.all, "profile"] as const,
  },

  // Profile related
  profile: {
    all: ["profile"] as const,
    detail: () => [...queryKeys.profile.all, "detail"] as const,
  },

  // Product related
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: unknown) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    search: (query?: string) => [...queryKeys.products.all, "search", query] as const,
    active: () => [...queryKeys.products.all, "active"] as const,
    critical: () => [...queryKeys.products.all, "critical"] as const,
    outOfStock: () => [...queryKeys.products.all, "out-of-stock"] as const,
  },

  // Category related
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: unknown) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    active: () => [...queryKeys.categories.all, "active"] as const,
  },

  // Broker related
  brokers: {
    all: ["brokers"] as const,
    lists: () => [...queryKeys.brokers.all, "list"] as const,
    list: (filters?: unknown) => [...queryKeys.brokers.lists(), filters] as const,
    details: () => [...queryKeys.brokers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.brokers.details(), id] as const,
    transactions: (id: string) => [...queryKeys.brokers.detail(id), "transactions"] as const,
    debt: (id: string) => [...queryKeys.brokers.detail(id), "debt"] as const,
    statements: (id: string) => [...queryKeys.brokers.detail(id), "statements"] as const,
    invoices: (id: string) => [...queryKeys.brokers.detail(id), "invoices"] as const,
  },

  // Stock related
  stock: {
    all: ["stock"] as const,
    movements: () => [...queryKeys.stock.all, "movements"] as const,
    movement: (filters?: unknown) => [...queryKeys.stock.movements(), filters] as const,
    summary: () => [...queryKeys.stock.all, "summary"] as const,
    reports: () => [...queryKeys.stock.all, "reports"] as const,
    report: (type: string, period?: string) =>
      [...queryKeys.stock.reports(), type, period] as const,
  },

  // Inventory related
  inventory: {
    all: ["inventory"] as const,
    lists: () => [...queryKeys.inventory.all, "list"] as const,
    list: (filters?: unknown) => [...queryKeys.inventory.lists(), filters] as const,
    details: () => [...queryKeys.inventory.all, "detail"] as const,
    detail: (id: string | number) => [...queryKeys.inventory.details(), id] as const,
    critical: () => [...queryKeys.inventory.all, "critical"] as const,
    outOfStock: () => [...queryKeys.inventory.all, "outOfStock"] as const,
    available: () => [...queryKeys.inventory.all, "available"] as const,
    updates: () => [...queryKeys.inventory.all, "update"] as const,
  },

  // Payment related
  payments: {
    all: ["payments"] as const,
    broker: (brokerId: string) => [...queryKeys.payments.all, "broker", brokerId] as const,
  },

  // Sales related (SalesController)
  sales: {
    all: ["sales"] as const,
    products: () => [...queryKeys.sales.all, "products"] as const,
    transactions: () => [...queryKeys.sales.all, "transactions"] as const,
    invoices: () => [...queryKeys.sales.all, "invoices"] as const,
    history: (brokerId?: string) => [...queryKeys.sales.all, "history", brokerId] as const,

    // NEW: mutations / calculation states per broker
    calculate: (brokerId: string | number) =>
      [...queryKeys.sales.all, "calculate", String(brokerId)] as const,
    confirm: (brokerId: string | number) =>
      [...queryKeys.sales.all, "confirm", String(brokerId)] as const,
    cancel: (brokerId: string | number) =>
      [...queryKeys.sales.all, "cancel", String(brokerId)] as const,
  },

  // Basket related (per broker)
  basket: {
    all: ["basket"] as const,
    byBroker: (brokerId: string | number) => [...queryKeys.basket.all, String(brokerId)] as const,
  },

  // Transaction related
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters?: unknown) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    sales: () => [...queryKeys.transactions.all, "sales"] as const,
    collections: () => [...queryKeys.transactions.all, "collections"] as const,
  },

  // Invoice related
  invoices: {
    all: ["invoices"] as const,
    lists: () => [...queryKeys.invoices.all, "list"] as const,
    list: (filters?: unknown) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    broker: (brokerId: string) => [...queryKeys.invoices.all, "broker", brokerId] as const,
  },

  // Dashboard/Statistics
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    overview: () => [...queryKeys.dashboard.all, "overview"] as const,
    recentActivities: () => [...queryKeys.dashboard.all, "recent-activities"] as const,
  },
} as const;

// Query key factory helper
export type QueryKeys = typeof queryKeys;
