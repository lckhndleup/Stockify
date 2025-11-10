// src/types/profile.ts

/**
 * User Info
 */
export interface UserInfo {
  profileImageId: number;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  email: string;
  tkn: string;
  vkn: string;
  role: "ROLE_ADMIN" | "ROLE_USER";
}

/**
 * Company Info
 */
export interface CompanyInfo {
  companyId: number;
  creatorUserId: number;
  logoImageId: number;
  name: string;
  address: string;
  phoneNumber: string;
  invoiceUsername: string;
  invoicePassword?: string;
}

/**
 * Profile Images
 */
export interface ProfileImages {
  profileImageDownloadUr?: string; // API'deki typo'yu koruyoruz
  companyLogoDownloadUrl?: string;
}

/**
 * Profile Response - GET /profile
 */
export interface ProfileResponse {
  user: UserInfo;
  company: CompanyInfo;
  images: ProfileImages;
}

/**
 * Profile Update Request - PUT /profile/update
 */
export interface ProfileUpdateRequest {
  user?: Partial<UserInfo>;
  company?: Partial<CompanyInfo>;
}

/**
 * Password Change Request - PUT /profile/change-password
 */
export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password Change Response
 */
export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

/**
 * Account Delete Request - DELETE /profile/delete
 */
export interface AccountDeleteRequest {
  password: string;
  confirmation: boolean;
}

/**
 * Account Delete Response
 */
export interface AccountDeleteResponse {
  success: boolean;
  message: string;
}
