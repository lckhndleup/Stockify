// -------------------- Auth --------------------

import { getToken, request } from "../base";
import { LoginRequest, LoginResponse, LogoutResponse } from "./type";

enum LoginEndpoint {
  LOGIN = "/auth/login",
  LOGOUT = "/auth/logout",
}

const requestLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return request(LoginEndpoint.LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

// 👈 YENİ: Logout API method
const requestLogout = async (): Promise<LogoutResponse> => {
  alert("wdsf requestLogout");

  if (!getToken()) {
    return { success: true, message: "Zaten çıkış yapılmış" };
  }

  return request(LoginEndpoint.LOGOUT, {
    method: "DELETE",
  });
};

export { requestLogin, requestLogout };
