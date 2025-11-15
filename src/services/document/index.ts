import type { ApiError } from "@/src/types/apiTypes";
import logger from "@/src/utils/logger";
import Config from "@/src/config";

const API_BASE_URL = Config.API_URL;

export function getAuthenticatedImageUri(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export async function downloadDocument(url: string, token?: string | null): Promise<Blob> {
  try {
    logger.debug("📄 API: Downloading document from:", url);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const finalUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

    const response = await fetch(finalUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw {
        message: "Belge indirilemedi",
        status: response.status,
      } as ApiError;
    }

    const blob = await response.blob();
    logger.debug("✅ API: Document downloaded, size:", blob.size);

    return blob;
  } catch (error) {
    logger.error("📄 API: Document download error:", error);
    throw error;
  }
}
