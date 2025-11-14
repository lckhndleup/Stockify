// app/profile/index.tsx
import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, Image, Linking } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Container, Typography, Input, Button, Icon } from "@/src/components/ui";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useUploadProfileImage,
  useUploadCompanyLogo,
} from "@/src/hooks/api/useProfile";
import { useAuthStore } from "@/src/stores/authStore";
import { useToast } from "@/src/hooks/useToast";
import Toast from "@/src/components/ui/toast";
import logger from "@/src/utils/logger";
import { getAuthenticatedImageUri } from "@/src/services/document";
import { getAuthHeaders } from "@/src/services/base";

export default function ProfilePage() {
  const { data: profile, isLoading, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const uploadProfileImageMutation = useUploadProfileImage();
  const uploadCompanyLogoMutation = useUploadCompanyLogo();
  const { logout } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    tkn: "",
    vkn: "",
  });

  // Company edit state
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    address: "",
    phoneNumber: "",
    invoiceUsername: "",
  });

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize forms when profile loads
  React.useEffect(() => {
    if (profile && !isEditingProfile) {
      setProfileForm({
        username: profile.user?.username || "",
        email: profile.user?.email || "",
        firstName: profile.user?.firstName || "",
        lastName: profile.user?.lastName || "",
        tkn: profile.user?.tkn || "",
        vkn: profile.user?.vkn || "",
      });
    }
    if (profile && !isEditingCompany) {
      setCompanyForm({
        name: profile.company?.name || "",
        address: profile.company?.address || "",
        phoneNumber: profile.company?.phoneNumber || "",
        invoiceUsername: profile.company?.invoiceUsername || "",
      });
    }
  }, [profile, isEditingProfile, isEditingCompany]);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (profile) {
      setProfileForm({
        username: profile.user?.username || "",
        email: profile.user?.email || "",
        firstName: profile.user?.firstName || "",
        lastName: profile.user?.lastName || "",
        tkn: profile.user?.tkn || "",
        vkn: profile.user?.vkn || "",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      logger.debug("💾 Saving profile changes...");

      await updateProfileMutation.mutateAsync({
        user: profileForm,
      });

      showToast("Profil başarıyla güncellendi", "success");
      setIsEditingProfile(false);
      refetch();
    } catch (error: any) {
      logger.error("❌ Profile update error:", error);
      showToast(error?.message || "Profil güncellenemedi", "error");
    }
  };

  const handleEditCompany = () => {
    setIsEditingCompany(true);
  };

  const handleCancelCompanyEdit = () => {
    setIsEditingCompany(false);
    if (profile) {
      setCompanyForm({
        name: profile.company?.name || "",
        address: profile.company?.address || "",
        phoneNumber: profile.company?.phoneNumber || "",
        invoiceUsername: profile.company?.invoiceUsername || "",
      });
    }
  };

  const handleSaveCompany = async () => {
    try {
      logger.debug("💾 Saving company changes...");

      await updateProfileMutation.mutateAsync({
        company: companyForm,
      });

      showToast("Şirket bilgileri başarıyla güncellendi", "success");
      setIsEditingCompany(false);
      refetch();
    } catch (error: any) {
      logger.error("❌ Company update error:", error);
      showToast(error?.message || "Şirket bilgileri güncellenemedi", "error");
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast("Tüm alanları doldurun", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("Yeni şifreler eşleşmiyor", "error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast("Şifre en az 6 karakter olmalı", "error");
      return;
    }

    try {
      logger.debug("🔐 Changing password...");

      await changePasswordMutation.mutateAsync({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      showToast("Şifre başarıyla değiştirildi", "success");
      setIsChangingPassword(false);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      logger.error("❌ Password change error:", error);
      showToast(error?.message || "Şifre değiştirilemedi", "error");
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            logger.error("❌ Logout error:", error);
            router.replace("/login");
          }
        },
      },
    ]);
  };

  const handleProfileImageUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Profil fotoğrafı yüklemek için galeriye erişim izni gerekiyor. Ayarlardan izin verebilirsiniz.",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Ayarlara Git",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        logger.debug("📸 Image selected:", result.assets[0].uri);

        // Pass ImagePicker asset directly to mutation
        await uploadProfileImageMutation.mutateAsync(result.assets[0]);
        showToast("Profil fotoğrafı başarıyla güncellendi", "success");
        refetch();
      }
    } catch (error: any) {
      logger.error("❌ Profile image upload error:", error);
      showToast(error?.message || "Fotoğraf yüklenemedi", "error");
    }
  };

  const handleCompanyLogoUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Şirket logosu yüklemek için galeriye erişim izni gerekiyor. Ayarlardan izin verebilirsiniz.",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Ayarlara Git",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        logger.debug("🏢 Logo selected:", result.assets[0].uri);

        // Pass ImagePicker asset directly to mutation
        await uploadCompanyLogoMutation.mutateAsync(result.assets[0]);
        showToast("Şirket logosu başarıyla güncellendi", "success");
        refetch();
      }
    } catch (error: any) {
      logger.error("❌ Company logo upload error:", error);
      showToast(error?.message || "Logo yüklenemedi", "error");
    }
  };

  if (isLoading) {
    return (
      <Container className="bg-white justify-center items-center">
        <Icon family="MaterialIcons" name="hourglass-empty" size={48} color="#9CA3AF" />
        <Typography variant="body" className="text-gray-500 mt-4">
          Profil yükleniyor...
        </Typography>
      </Container>
    );
  }

  return (
    <Container className="bg-white" safeTop={false} padding="none">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Modern Header */}
        <View className="bg-white pt-14 pb-6 px-5 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1" style={{ marginRight: 16 }}>
              <Typography variant="caption" className="text-gray-500 mb-1">
                Hesap Yönetimi
              </Typography>
              <Typography variant="h1" weight="bold" size="2xl" className="text-gray-900">
                {profile?.company?.name || "Profil"}
              </Typography>
            </View>

            {/* Company Logo */}
            <TouchableOpacity
              onPress={handleCompanyLogoUpload}
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                position: "relative",
              }}
              activeOpacity={0.7}
            >
              {profile?.images?.companyLogoDownloadUrl ? (
                <Image
                  source={{
                    uri: getAuthenticatedImageUri(profile.images.companyLogoDownloadUrl)!,
                    headers: getAuthHeaders(),
                  }}
                  style={{ width: 48, height: 48, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <Icon family="MaterialIcons" name="business" size={24} color="#9CA3AF" />
              )}
              {/* Edit Icon */}
              <View
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  backgroundColor: "#DC2626",
                  borderRadius: 10,
                  padding: 4,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                }}
              >
                <Icon family="MaterialIcons" name="edit" size={10} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Summary Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <TouchableOpacity
              onPress={handleProfileImageUpload}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#DC2626",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
              activeOpacity={0.7}
            >
              {profile?.images?.profileImageDownloadUr ? (
                <Image
                  source={{
                    uri: getAuthenticatedImageUri(profile.images.profileImageDownloadUr)!,
                    headers: getAuthHeaders(),
                  }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                  resizeMode="cover"
                />
              ) : (
                <Icon family="MaterialIcons" name="person" size={32} color="#FFFFFF" />
              )}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  padding: 4,
                  borderWidth: 2,
                  borderColor: "#F3F4F6",
                }}
              >
                <Icon family="MaterialIcons" name="camera-alt" size={12} color="#DC2626" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="bold" className="text-gray-900 mb-1">
                {profile?.user?.firstName && profile?.user?.lastName
                  ? `${profile.user.firstName} ${profile.user.lastName}`
                  : profile?.user?.username || "Kullanıcı"}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {profile?.user?.email || "email@example.com"}
              </Typography>
              <Typography variant="caption" className="text-gray-400 mt-1">
                {profile?.user?.role === "ROLE_ADMIN" ? "Yönetici" : "Kullanıcı"}
              </Typography>
            </View>
          </View>
        </View>

        <View className="px-5 py-6">
          {/* Profile Information Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="body" weight="semibold" className="text-gray-900">
                Profil Bilgileri
              </Typography>
              {!isEditingProfile ? (
                <TouchableOpacity
                  onPress={handleEditProfile}
                  style={{
                    backgroundColor: "#DC2626",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <Icon family="MaterialIcons" name="edit" size={16} color="#FFFFFF" />
                  <Typography variant="caption" weight="medium" className="text-white">
                    Düzenle
                  </Typography>
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                    activeOpacity={0.7}
                  >
                    <Typography variant="caption" weight="medium" className="text-gray-700">
                      İptal
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    style={{
                      backgroundColor: "#10B981",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                    activeOpacity={0.7}
                  >
                    <Typography variant="caption" weight="medium" className="text-white">
                      Kaydet
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <View className="gap-3">
                <Input
                  label="Kullanıcı Adı"
                  value={profileForm.username}
                  onChangeText={(text) => setProfileForm({ ...profileForm, username: text })}
                  editable={isEditingProfile}
                  leftIcon={
                    <Icon family="MaterialIcons" name="account-circle" size={20} color="#9CA3AF" />
                  }
                />

                <Input
                  label="E-posta"
                  value={profileForm.email}
                  onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                  keyboardType="email-address"
                  editable={isEditingProfile}
                  leftIcon={<Icon family="MaterialIcons" name="email" size={20} color="#9CA3AF" />}
                />

                <Input
                  label="Ad"
                  value={profileForm.firstName}
                  onChangeText={(text) => setProfileForm({ ...profileForm, firstName: text })}
                  editable={isEditingProfile}
                  leftIcon={<Icon family="MaterialIcons" name="person" size={20} color="#9CA3AF" />}
                />

                <Input
                  label="Soyad"
                  value={profileForm.lastName}
                  onChangeText={(text) => setProfileForm({ ...profileForm, lastName: text })}
                  editable={isEditingProfile}
                  leftIcon={<Icon family="MaterialIcons" name="person" size={20} color="#9CA3AF" />}
                />

                <Input
                  label="TC Kimlik No"
                  value={profileForm.tkn}
                  onChangeText={(text) => setProfileForm({ ...profileForm, tkn: text })}
                  keyboardType="numeric"
                  editable={isEditingProfile}
                  leftIcon={<Icon family="MaterialIcons" name="badge" size={20} color="#9CA3AF" />}
                />

                <Input
                  label="Vergi Kimlik No"
                  value={profileForm.vkn}
                  onChangeText={(text) => setProfileForm({ ...profileForm, vkn: text })}
                  keyboardType="numeric"
                  editable={isEditingProfile}
                  leftIcon={
                    <Icon family="MaterialIcons" name="receipt-long" size={20} color="#9CA3AF" />
                  }
                />
              </View>

              {isEditingProfile && (
                <View className="mt-4">
                  <Button
                    onPress={handleSaveProfile}
                    loading={updateProfileMutation.isPending}
                    disabled={updateProfileMutation.isPending}
                  >
                    Değişiklikleri Kaydet
                  </Button>
                </View>
              )}
            </View>
          </View>

          {/* Company Information Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="body" weight="semibold" className="text-gray-900">
                Şirket Bilgileri
              </Typography>
              {!isEditingCompany ? (
                <TouchableOpacity
                  onPress={handleEditCompany}
                  style={{
                    backgroundColor: "#DC2626",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <Icon family="MaterialIcons" name="edit" size={16} color="#FFFFFF" />
                  <Typography variant="caption" weight="medium" className="text-white">
                    Düzenle
                  </Typography>
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleCancelCompanyEdit}
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                    activeOpacity={0.7}
                  >
                    <Typography variant="caption" weight="medium" className="text-gray-700">
                      İptal
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveCompany}
                    style={{
                      backgroundColor: "#10B981",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                    activeOpacity={0.7}
                  >
                    <Typography variant="caption" weight="medium" className="text-white">
                      Kaydet
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <View className="gap-3">
                <View className="mb-2">
                  <Typography variant="caption" className="text-gray-700 mb-2">
                    Bu şirket adı header'da gösterilir
                  </Typography>
                  <Input
                    label="Şirket Adı"
                    value={companyForm.name}
                    onChangeText={(text) => setCompanyForm({ ...companyForm, name: text })}
                    editable={isEditingCompany}
                    leftIcon={
                      <Icon family="MaterialIcons" name="business" size={20} color="#9CA3AF" />
                    }
                  />
                </View>

                <Input
                  label="Adres"
                  value={companyForm.address}
                  onChangeText={(text) => setCompanyForm({ ...companyForm, address: text })}
                  editable={isEditingCompany}
                  multiline
                  numberOfLines={3}
                  leftIcon={
                    <Icon family="MaterialIcons" name="location-on" size={20} color="#9CA3AF" />
                  }
                />

                <Input
                  label="Telefon"
                  value={companyForm.phoneNumber}
                  onChangeText={(text) => setCompanyForm({ ...companyForm, phoneNumber: text })}
                  keyboardType="phone-pad"
                  editable={isEditingCompany}
                  leftIcon={<Icon family="MaterialIcons" name="phone" size={20} color="#9CA3AF" />}
                />

                <Input
                  label="Fatura Kullanıcı Adı"
                  value={companyForm.invoiceUsername}
                  onChangeText={(text) => setCompanyForm({ ...companyForm, invoiceUsername: text })}
                  editable={isEditingCompany}
                  leftIcon={
                    <Icon family="MaterialIcons" name="receipt" size={20} color="#9CA3AF" />
                  }
                />
              </View>

              {isEditingCompany && (
                <View className="mt-4">
                  <Button
                    onPress={handleSaveCompany}
                    loading={updateProfileMutation.isPending}
                    disabled={updateProfileMutation.isPending}
                  >
                    Değişiklikleri Kaydet
                  </Button>
                </View>
              )}
            </View>
          </View>

          {/* Password Change Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="body" weight="semibold" className="text-gray-900">
                Şifre Değiştir
              </Typography>
              {!isChangingPassword && (
                <TouchableOpacity
                  onPress={() => setIsChangingPassword(true)}
                  style={{
                    backgroundColor: "#DC2626",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                  activeOpacity={0.7}
                >
                  <Icon family="MaterialIcons" name="lock" size={16} color="#FFFFFF" />
                  <Typography variant="caption" weight="medium" className="text-white">
                    Değiştir
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {isChangingPassword ? (
                <View className="gap-3">
                  <Input
                    label="Mevcut Şifre"
                    value={passwordForm.oldPassword}
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, oldPassword: text })}
                    secureTextEntry
                    leftIcon={<Icon family="MaterialIcons" name="lock" size={20} color="#9CA3AF" />}
                  />

                  <Input
                    label="Yeni Şifre"
                    value={passwordForm.newPassword}
                    onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                    secureTextEntry
                    leftIcon={
                      <Icon family="MaterialIcons" name="lock-outline" size={20} color="#9CA3AF" />
                    }
                  />

                  <Input
                    label="Yeni Şifre (Tekrar)"
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: text })
                    }
                    secureTextEntry
                    leftIcon={
                      <Icon family="MaterialIcons" name="lock-outline" size={20} color="#9CA3AF" />
                    }
                  />

                  <View className="flex-row gap-2 mt-2">
                    <Button
                      variant="outline"
                      onPress={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({
                          oldPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      onPress={handleChangePassword}
                      loading={changePasswordMutation.isPending}
                      disabled={changePasswordMutation.isPending}
                      className="flex-1"
                    >
                      Şifreyi Değiştir
                    </Button>
                  </View>
                </View>
              ) : (
                <Typography variant="body" className="text-gray-500">
                  Şifrenizi değiştirmek için tıklayın
                </Typography>
              )}
            </View>
          </View>

          {/* Account Actions Section */}
          <View className="mb-6">
            <Typography variant="body" weight="semibold" className="text-gray-900 mb-4">
              Hesap İşlemleri
            </Typography>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      backgroundColor: "#FEF2F2",
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Icon family="MaterialIcons" name="logout" size={20} color="#DC2626" />
                  </View>
                  <Typography variant="body" weight="medium" className="text-gray-900">
                    Çıkış Yap
                  </Typography>
                </View>
                <Icon family="MaterialIcons" name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View className="items-center mt-4">
            <Typography variant="caption" className="text-gray-400">
              Stockify v1.0.0
            </Typography>
            <Typography variant="caption" className="text-gray-400 mt-1">
              © 2025 Tüm hakları saklıdır
            </Typography>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
