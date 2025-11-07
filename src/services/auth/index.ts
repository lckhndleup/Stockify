// -------------------- Auth --------------------

import { getToken, request } from "../base";
import { LoginRequest, LoginResponse, LogoutResponse } from "./type";
import logger from "@/src/utils/logger";

enum LoginEndpoint {
  LOGIN = "/auth/login",
  LOGOUT = "/auth/logout",
}

const requestLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const requestBody = JSON.stringify(credentials);
  logger.debug("🔍 Login Request Body:", requestBody);
  logger.debug("🔍 Login Request URL:", LoginEndpoint.LOGIN);
  return request(LoginEndpoint.LOGIN, {
    method: "POST",
    body: requestBody,
  });
};

// 👈 YENİ: Logout API method
const requestLogout = async (): Promise<LogoutResponse> => {
  if (!getToken()) {
    return { success: true, message: "Zaten çıkış yapılmış" };
  }

  return request(LoginEndpoint.LOGOUT, {
    method: "DELETE",
  });
};

export { requestLogin, requestLogout };
