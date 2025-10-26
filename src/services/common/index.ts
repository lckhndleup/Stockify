// -------------------- Document Download (with auth) --------------------

import { getToken } from "../base";

/** Download document with authentication */
const downloadDocument = async (url: string): Promise<Blob> => {
  // Token'ı header'a ekle
  const headers: Record<string, string> = {};
  if (getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw {
      message: "Belge indirilemedi",
      status: response.status,
    };
  }

  const blob = await response.blob();

  return blob;
};

export { downloadDocument };
