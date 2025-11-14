// src/hooks/api/useProfile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadProfileImage,
  uploadCompanyLogo,
} from "@/src/services/profile";
import { queryKeys } from "./queryKeys";
import type { ApiError } from "@/src/types/apiTypes";
import type {
  ProfileResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  PasswordChangeResponse,
  AccountDeleteRequest,
  AccountDeleteResponse,
} from "@/src/types/profile";
import logger from "@/src/utils/logger";

/**
 * Hook: Get current user profile
 * GET /profile
 */
export const useProfile = () => {
  return useQuery<ProfileResponse, ApiError>({
    queryKey: queryKeys.profile.detail(),
    queryFn: async () => {
      logger.debug("🔍 Fetching user profile...");
      const result = await getProfile();
      logger.debug("✅ Profile fetched successfully");
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

/**
 * Hook: Update user profile
 * PUT /profile/update
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<ProfileResponse, ApiError, ProfileUpdateRequest>({
    mutationFn: async (profileData: ProfileUpdateRequest) => {
      logger.debug("📝 Updating profile...", profileData);
      const result = await updateProfile(profileData);
      logger.debug("✅ Profile updated successfully");
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      logger.info("✅ Profile cache invalidated");
    },
    onError: (error) => {
      logger.error("❌ Profile update failed:", error);
    },
  });
};

/**
 * Hook: Change user password
 * PUT /profile/change-password
 */
export const useChangePassword = () => {
  return useMutation<PasswordChangeResponse, ApiError, PasswordChangeRequest>({
    mutationFn: async (passwordData: PasswordChangeRequest) => {
      logger.debug("🔐 Changing password...");
      const result = await changePassword(passwordData);
      logger.debug("✅ Password changed successfully");
      return result;
    },
    onSuccess: () => {
      logger.info("✅ Password change successful");
    },
    onError: (error) => {
      logger.error("❌ Password change failed:", error);
    },
  });
};

/**
 * Hook: Delete user account
 * DELETE /profile/delete
 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<AccountDeleteResponse, ApiError, AccountDeleteRequest>({
    mutationFn: async (deleteData: AccountDeleteRequest) => {
      logger.debug("🗑️ Deleting account...");
      const result = await deleteAccount(deleteData);
      logger.debug("✅ Account deleted successfully");
      return result;
    },
    onSuccess: () => {
      // Clear all cache
      queryClient.clear();
      logger.info("✅ Account deleted, cache cleared");
    },
    onError: (error) => {
      logger.error("❌ Account deletion failed:", error);
    },
  });
};

/**
 * Hook: Upload profile image
 * POST /profile/upload/profile-image
 */
export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation<ProfileResponse, ApiError, any>({
    mutationFn: async (imageFile: any) => {
      logger.debug("📸 Uploading profile image...");
      const result = await uploadProfileImage(imageFile);
      logger.debug("✅ Profile image uploaded successfully");
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      logger.info("✅ Profile image uploaded, cache invalidated");
    },
    onError: (error) => {
      logger.error("❌ Profile image upload failed:", error);
    },
  });
};

/**
 * Hook: Upload company logo
 * POST /profile/upload/company-logo
 */
export const useUploadCompanyLogo = () => {
  const queryClient = useQueryClient();

  return useMutation<ProfileResponse, ApiError, any>({
    mutationFn: async (imageFile: any) => {
      logger.debug("🏢 Uploading company logo...");
      const result = await uploadCompanyLogo(imageFile);
      logger.debug("✅ Company logo uploaded successfully");
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      logger.info("✅ Company logo uploaded, cache invalidated");
    },
    onError: (error) => {
      logger.error("❌ Company logo upload failed:", error);
    },
  });
};
