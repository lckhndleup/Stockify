// src/utils/apiError.ts

export type NormalizedApiError = {
  message: string;
  status?: number;
  code?: string | number;
  details?: unknown;
};

const looksLikeApiError = (err: any) =>
  err &&
  typeof err === "object" &&
  ("message" in err || "status" in err || "code" in err);

export function parseApiError(error: unknown): NormalizedApiError {
  if (looksLikeApiError(error)) {
    return {
      message: (error as any).message ?? "Bilinmeyen bir hata oluştu",
      status: (error as any).status,
      code: (error as any).code,
      details: error,
    };
  }
  if (error instanceof Error) return { message: error.message };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: "Bilinmeyen bir hata oluştu" };
  }
}
