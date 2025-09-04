import React, { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Button,
  Modal,
  Input,
} from "@/src/components/ui";
import Toast from "@/src/components/ui/toast";
import { useToast } from "@/src/hooks/useToast";
import { useAppStore, Category } from "@/src/stores/appStore";
import {
  categorySchema,
  editCategorySchema,
} from "@/src/validations/salesValidation";

export default function CategoriesPage() {
  const [searchText, setSearchText] = useState("");

  // Modal states
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] =
    useState(false);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryTaxRate, setCategoryTaxRate] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Global Store
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getActiveCategories,
    getProductsByCategoryId,
    globalToast,
    hideGlobalToast,
  } = useAppStore();

  // Toast
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleAddCategory = () => {
    setIsCategoryModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryTaxRate(category.taxRate.toString());
    setValidationErrors({});
    setIsEditCategoryModalVisible(true);
  };

  const handleDeleteCategory = (category: Category) => {
    const categoryProducts = getProductsByCategoryId(category.id);

    if (categoryProducts.length > 0) {
      Alert.alert(
        "Kategori Silinemez",
        `"${category.name}" kategorisi silinemez çünkü ${categoryProducts.length} adet ürünü bu kategoriye bağlı.\n\nÖnce bu kategorideki ürünleri silin veya başka kategoriye taşıyın.`
      );
      return;
    }

    Alert.alert(
      "Kategori Sil",
      `"${category.name}" kategorisini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            try {
              const success = deleteCategory(category.id);
              if (success) {
                showSuccess("Kategori başarıyla silindi!");
              } else {
                showError("Kategori silinemedi.");
              }
            } catch (error) {
              showError("Kategori silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const validateCategoryForm = () => {
    try {
      categorySchema.parse({
        name: categoryName,
        taxRate: categoryTaxRate,
      });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  const validateEditCategoryForm = () => {
    try {
      editCategorySchema.parse({
        name: categoryName,
        taxRate: categoryTaxRate,
      });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  const handleSaveCategory = () => {
    if (!validateCategoryForm()) {
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
          onPress: () => {
            try {
              addCategory({
                name: categoryName,
                taxRate: taxRate,
              });
              handleCloseCategoryModal();
              showSuccess("Kategori başarıyla eklendi!");
            } catch (error) {
              showError("Kategori eklenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleUpdateCategory = () => {
    if (!validateEditCategoryForm() || !editingCategory) {
      showError("Lütfen form hatalarını düzeltin.");
      return;
    }

    const taxRate = parseFloat(categoryTaxRate);

    Alert.alert(
      "Kategori Güncelle",
      `"${categoryName}" olarak güncellemek istediğinizden emin misiniz?\n\nKDV Oranı: %${taxRate}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Güncelle",
          onPress: () => {
            try {
              updateCategory(editingCategory.id, {
                name: categoryName,
                taxRate: taxRate,
              });
              handleCloseEditCategoryModal();
              showSuccess("Kategori başarıyla güncellendi!");
            } catch (error) {
              showError("Kategori güncellenirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalVisible(false);
    setCategoryName("");
    setCategoryTaxRate("");
    setValidationErrors({});
  };

  const handleCloseEditCategoryModal = () => {
    setIsEditCategoryModalVisible(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryTaxRate("");
    setValidationErrors({});
  };

  // Filtering
  const activeCategories = getActiveCategories();
  const filteredCategories = activeCategories.filter((category) =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Container className="bg-white" padding="sm" safeTop={false}>
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      {/* Global Toast */}
      <Toast
        visible={globalToast.visible}
        message={globalToast.message}
        type={globalToast.type}
        onHide={hideGlobalToast}
      />

      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Kategori ara..."
          onSearch={handleSearch}
          className="mb-4"
        />

        {/* Kategori Listesi */}
        <View className="mt-3">
          {filteredCategories.map((category) => {
            const productCount = getProductsByCategoryId(category.id).length;

            return (
              <Card
                key={category.id}
                variant="default"
                padding="sm"
                className="border border-stock-border mb-3"
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
                      KDV Oranı: %{category.taxRate} • {productCount} ürün
                    </Typography>
                  </View>

                  <View className="flex-row items-center">
                    <Icon
                      family="MaterialIcons"
                      name="edit"
                      size={18}
                      color="#67686A"
                      pressable
                      onPress={() => handleEditCategory(category)}
                      containerClassName="mr-2"
                    />
                    <Icon
                      family="MaterialIcons"
                      name="delete"
                      size={18}
                      color="#E3001B"
                      pressable
                      onPress={() => handleDeleteCategory(category)}
                    />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Boş durum */}
        {filteredCategories.length === 0 && (
          <View className="items-center justify-center py-12">
            <Icon
              family="MaterialCommunityIcons"
              name="shape-outline"
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
        <View className="mt-6 mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleAddCategory}
            leftIcon={
              <Icon family="MaterialIcons" name="add" size={18} color="white" />
            }
          >
            Yeni Kategori Ekle
          </Button>
        </View>
      </ScrollView>

      {/* Kategori Ekleme Modal'ı */}
      <Modal
        visible={isCategoryModalVisible}
        onClose={handleCloseCategoryModal}
        title="Yeni Kategori Ekle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          <Input
            label="Kategori Adı *"
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Kategori adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          <Input
            label="KDV Oranı (%) *"
            value={categoryTaxRate}
            onChangeText={setCategoryTaxRate}
            placeholder="0-100 arası değer (örn: 18)"
            variant="outlined"
            numericOnly={true}
            error={validationErrors.taxRate}
            helperText="KDV oranını yüzde cinsinden girin"
            className="mb-4"
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleSaveCategory}
            >
              <Typography className="text-white">Ekle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseCategoryModal}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Kategori Düzenleme Modal'ı */}
      <Modal
        visible={isEditCategoryModalVisible}
        onClose={handleCloseEditCategoryModal}
        title="Kategori Düzenle"
        size="lg"
        className="bg-white mx-6"
      >
        <View>
          <Input
            label="Kategori Adı *"
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Kategori adını girin..."
            variant="outlined"
            error={validationErrors.name}
            className="mb-4"
          />

          <Input
            label="KDV Oranı (%) *"
            value={categoryTaxRate}
            onChangeText={setCategoryTaxRate}
            placeholder="0-100 arası değer (örn: 18)"
            variant="outlined"
            numericOnly={true}
            error={validationErrors.taxRate}
            helperText="KDV oranını yüzde cinsinden girin"
            className="mb-4"
          />

          <View className="mt-6">
            <Button
              variant="primary"
              fullWidth
              className="bg-stock-red mb-3"
              onPress={handleUpdateCategory}
            >
              <Typography className="text-white">Güncelle</Typography>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="border-stock-border"
              onPress={handleCloseEditCategoryModal}
            >
              <Typography className="text-stock-dark">İptal</Typography>
            </Button>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
