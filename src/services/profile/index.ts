import { request, getAuthHeaders, API_BASE_URL } from "../base";
import logger from "@/src/utils/logger";
import type {
  ProfileResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  PasswordChangeResponse,
  AccountDeleteRequest,
  AccountDeleteResponse,
} from "@/src/types/profile";
import type { ApiError } from "@/src/types/apiTypes";

export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    logger.debug("👤 API: Fetching user profile...");

    const result = await request<ProfileResponse>("/profile/detail", {
      method: "GET",
    });

    logger.debug("✅ API: Profile fetched:", result ? Object.keys(result) : "null");
    return result;
  } catch (error) {
    logger.error("👤 API: Profile fetch error:", error);
    throw error;
  }
};

export const updateProfile = async (
  profileData: ProfileUpdateRequest,
): Promise<ProfileResponse> => {
  try {
    logger.debug("👤 API: Updating profile:", profileData);

    const result = await request<ProfileResponse>("/profile/update", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });

    logger.debug("✅ API: Profile updated:", result ? Object.keys(result) : "null");
    return result;
  } catch (error) {
    logger.error("👤 API: Profile update error:", error);
    throw error;
  }
};

export const changePassword = async (
  passwordData: PasswordChangeRequest,
): Promise<PasswordChangeResponse> => {
  try {
    logger.debug("🔐 API: Changing password...");

    const result = await request<PasswordChangeResponse>("/profile/change-password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });

    logger.debug("✅ API: Password changed successfully");
    return result;
  } catch (error) {
    logger.error("🔐 API: Password change error:", error);
    throw error;
  }
};

export const deleteAccount = async (
  deleteData: AccountDeleteRequest,
): Promise<AccountDeleteResponse> => {
  try {
    logger.debug("🗑️ API: Deleting account...");

    const result = await request<AccountDeleteResponse>("/profile/delete", {
      method: "DELETE",
      body: JSON.stringify(deleteData),
    });

    logger.debug("✅ API: Account deleted successfully");
    return result;
  } catch (error) {
    logger.error("🗑️ API: Account delete error:", error);
    throw error;
  }
};

export const uploadProfileImage = async (imageFile: any): Promise<ProfileResponse> => {
  try {
    logger.debug("📸 API: Uploading profile image...");

    const formData = new FormData();

    formData.append("file", {
      uri: imageFile.uri,
      type: imageFile.type || "image/jpeg",
      name: imageFile.fileName || "profile.jpg",
    } as any);

    const response = await fetch(`${API_BASE_URL}/profile/upload/profile-image`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    if (!response.ok) {
      throw {
        message: "Profil fotoğrafı yüklenemedi",
        status: response.status,
      } as ApiError;
    }

    const result = await response.json();
    logger.debug("✅ API: Profile image uploaded successfully");
    return result;
  } catch (error) {
    logger.error("📸 API: Profile image upload error:", error);
    throw error;
  }
};

export const uploadCompanyLogo = async (imageFile: any): Promise<ProfileResponse> => {
  try {
    logger.debug("🏢 API: Uploading company logo...");

    const formData = new FormData();

    formData.append("file", {
      uri: imageFile.uri,
      type: imageFile.type || "image/jpeg",
      name: imageFile.fileName || "logo.jpg",
    } as any);

    const response = await fetch(`${API_BASE_URL}/profile/upload/company-logo`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    if (!response.ok) {
      throw {
        message: "Şirket logosu yüklenemedi",
        status: response.status,
      } as ApiError;
    }

    const result = await response.json();
    logger.debug("✅ API: Company logo uploaded successfully");
    return result;
  } catch (error) {
    logger.error("🏢 API: Company logo upload error:", error);
    throw error;
  }
};
