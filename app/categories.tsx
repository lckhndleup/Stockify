// app/categories.tsx
import React, { useState } from "react";
import { ScrollView, View, Alert, TouchableOpacity } from "react-native";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Button,
  Modal,
  Input,
  Loading,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";

// Backend hooks - DELETE HOOK EKLENDİ
import {
  useActiveCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory, // YENİ EKLENEN
} from "@/src/hooks/api/useCategories";
import { CategoryFormData, CategoryUpdateData } from "@/src/types/category";

// Basit validation - kategori adı ve vergi oranı için
const validateCategoryForm = (name: string, taxRate: string) => {
  const errors: Record<string, string> = {};

  if (!name.trim()) {
    errors.name = "Kategori adı zorunludur";
  } else if (name.trim().length < 2) {
    errors.name = "Kategori adı en az 2 karakter olmalıdır";
  }

  if (!taxRate.trim()) {
    errors.taxRate = "KDV oranı zorunludur";
  } else if (
    isNaN(Number(taxRate)) ||
    Number(taxRate) < 0 ||
    Number(taxRate) > 100
  ) {
    errors.taxRate = "KDV oranı 0-100 arası olmalıdır";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// Types
interface Category {
  id: string;
  name: string;
  taxRate: number;
  createdDate: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [searchText, setSearchText] = useState("");

  // Category Modal States
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Category Form States
  const [categoryName, setCategoryName] = useState("");
  const [categoryTaxRate, setCategoryTaxRate] = useState("");

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // BACKEND HOOKS
  // React Query Hook - BACKEND CATEGORIES
  const {
    data: backendCategories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorMessage,
    refetch: refetchCategories,
  } = useActiveCategories();

  // Backend Mutations
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory(); // YENİ EKLENEN

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  // Category Actions
  const handleAddCategory = () => {
    resetForm();
    setIsCategoryModalVisible(true);
  };

  const resetForm = () => {
    setCategoryName("");
    setCategoryTaxRate("");
    setValidationErrors({});
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalVisible(false);
    resetForm();
  };

  const handleConfirmAddCategory = async () => {
    const validation = validateCategoryForm(categoryName, categoryTaxRate);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const taxRate = parseFloat(categoryTaxRate);

    Alert.alert(
      "Kategori Ekle",
      `"${categoryName}" kategorisini eklemek istediğinizden emin misiniz?\n\nKDV Oranı: %${taxRate}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ekle",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e gönder
              const categoryFormData: CategoryFormData = {
                name: categoryName.trim(),
                taxRate: taxRate,
              };

              console.log("💾 Saving category to backend:", categoryFormData);

              const backendResult = await createCategoryMutation.mutateAsync(
                categoryFormData
              );

              if (backendResult) {
                handleCategoryModalClose();
                showSuccess("Kategori başarıyla eklendi!");

                // Kategorileri yenile
                refetchCategories();
              } else {
                throw new Error("Backend'den geçersiz yanıt alındı");
              }
            } catch (error) {
              console.error("❌ Category save error:", error);
              showError("Kategori eklenirken bir hata oluştu!");
            }
          },
        },
      ]
    );
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryTaxRate(category.taxRate.toString());
    setValidationErrors({});
    setIsEditCategoryModalVisible(true);
  };

  const handleEditCategoryModalClose = () => {
    setIsEditCategoryModalVisible(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      showError("Düzenlenecek kategori bulunamadı.");
      return;
    }

    const validation = validateCategoryForm(categoryName, categoryTaxRate);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const taxRate = parseFloat(categoryTaxRate);

    Alert.alert(
      "Kategori Güncelle",
      `"${categoryName}" kategorisini güncellemek istediğinizden emin misiniz?\n\nKDV Oranı: %${taxRate}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          style: "default",
          onPress: async () => {
            try {
              // Backend'e gönder
              const categoryUpdateData: CategoryUpdateData = {
                categoryId: Number(editingCategory.id),
                name: categoryName.trim(),
                taxRate: taxRate,
              };

              console.log(
                "✏️ Updating category in backend:",
                categoryUpdateData
              );

              await updateCategoryMutation.mutateAsync(categoryUpdateData);

              handleEditCategoryModalClose();
              showSuccess("Kategori başarıyla güncellendi!");

              // Kategorileri yenile
              refetchCategories();
            } catch (error) {
              console.error("❌ Category update error:", error);
              showError("Kategori güncellenirken bir hata oluştu!");
            }
          },
        },
      ]
    );
  };

  // YENİ EKLENEN: Category Delete Function
  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      "Kategori Sil",
      `"${category.name}" kategorisini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🗑️ Deleting category from backend:", category.id);

              await deleteCategoryMutation.mutateAsync(Number(category.id));

              showSuccess("Kategori başarıyla silindi!");

              // Kategorileri yenile
              refetchCategories();
            } catch (error) {
              console.error("❌ Category delete error:", error);
              showError("Kategori silinirken bir hata oluştu!");
            }
          },
        },
      ]
    );
  };

  // Filtering
  const getFilteredCategories = () => {
    return backendCategories.filter((category) =>
      category.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredCategories = getFilteredCategories();

  // Loading state
  if (categoriesLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Loading size="large" />
      </View>
    );
  }

  // Error state
  if (categoriesError) {
    return (
      <Container className="bg-white" padding="sm" safeTop={false}>
        <View className="flex-1 justify-center items-center p-4">
          <Typography className="text-red-600 text-center mb-4">
            Veriler yüklenirken bir hata oluştu
          </Typography>
          <Typography
            variant="caption"
            className="text-gray-500 text-center mb-4"
          >
            {categoriesErrorMessage?.message || "Bilinmeyen hata"}
          </Typography>
          <Button
            onPress={() => refetchCategories()}
            variant="primary"
            size="md"
          >
            Yeniden Dene
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search ve Add Butonu */}
        <View className="flex-row items-center mb-3">
          <SearchBar
            placeholder="Kategori ara..."
            onSearch={handleSearch}
            className="flex-1 mr-3"
          />
          <Icon
            family="MaterialIcons"
            name="add"
            size={28}
            color="#E3001B"
            pressable
            onPress={handleAddCategory}
            containerClassName="bg-gray-100 px-4 py-3 rounded-lg"
          />
        </View>

        {/* Kategori Listesi */}
        <View className="mt-3">
          {filteredCategories.map((category) => (
            <Card
              key={category.id}
              variant="default"
              padding="sm"
              className="border border-stock-border mb-2"
              radius="md"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Typography
                    variant="body"
                    weight="semibold"
                    align="left"
                    className="text-stock-dark"
                  >
                    {category.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    size="sm"
                    className="text-stock-text mt-1"
                  >
                    KDV Oranı: %{category.taxRate}
                  </Typography>
                </View>

                <View className="flex-row items-center">
                  {/* Edit Icon */}
                  <Icon
                    family="MaterialIcons"
                    name="edit"
                    size={18}
                    color="#67686A"
                    pressable
                    onPress={() => handleEditCategory(category)}
                    containerClassName="mr-2"
                  />

                  {/* Delete Icon - YENİ EKLENEN */}
                  <Icon
                    family="MaterialIcons"
                    name="delete"
                    size={18}
                    color="#E3001B" // stock-red color
                    pressable
                    onPress={() => handleDeleteCategory(category)}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <View className="items-center justify-center py-12">
            <Icon
              family="MaterialIcons"
              name="category"
              size={64}
              color="#ECECEC"
              containerClassName="mb-4"
            />
            <Typography variant="body" className="text-stock-text text-center">
              {searchText.trim()
                ? "Arama kriterinize uygun kategori bulunamadı."
                : "Henüz kategori eklenmemiş."}
            </Typography>
          </View>
        )}

        {/* Yeni Kategori Ekle Butonu */}
        <View className="mt-4 mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleAddCategory}
            loading={createCategoryMutation.isPending}
            leftIcon={
              <Icon family="MaterialIcons" name="add" size={20} color="white" />
            }
          >
            Yeni Kategori Ekle
          </Button>
        </View>
      </ScrollView>

      {/* Kategori Ekleme Modal'ı */}
      <Modal
        visible={isCategoryModalVisible}
        onClose={handleCategoryModalClose}
        title="Yeni Kategori Ekle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Adı */}
          <Input
            label="Kategori Adı *"
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Kategori adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          {/* KDV Oranı */}
          <Input
            label="KDV Oranı (%) *"
            value={categoryTaxRate}
            onChangeText={setCategoryTaxRate}
            placeholder="0-100 arası değer (örn: 18)"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.taxRate}
            helperText="KDV oranını yüzde cinsinden girin"
            className="mb-4"
          />

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleConfirmAddCategory}
              loading={createCategoryMutation.isPending}
              disabled={createCategoryMutation.isPending}
            >
              <Typography className="text-white">
                {createCategoryMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCategoryModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Kategori Düzenleme Modal'ı */}
      <Modal
        visible={isEditCategoryModalVisible}
        onClose={handleEditCategoryModalClose}
        title="Kategori Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          {/* Kategori Adı */}
          <Input
            label="Kategori Adı *"
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Kategori adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          {/* KDV Oranı */}
          <Input
            label="KDV Oranı (%) *"
            value={categoryTaxRate}
            onChangeText={setCategoryTaxRate}
            placeholder="0-100 arası değer (örn: 18)"
            variant="outlined"
            keyboardType="numeric"
            error={validationErrors.taxRate}
            helperText="KDV oranını yüzde cinsinden girin"
            className="mb-4"
          />

          {/* Butonlar */}
          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateCategory}
              loading={updateCategoryMutation.isPending}
            >
              <Typography className="text-white">Güncelle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleEditCategoryModalClose}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
