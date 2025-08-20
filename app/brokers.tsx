import React from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";

import {
  Container,
  Typography,
  Card,
  SearchBar,
  Icon,
  Button,
} from "@/src/components/ui";

export default function BrokersPage() {
  const handleSearch = (text: string) => {
    console.log("Aracı arama:", text);
  };

  const handleAddBroker = () => {
    console.log("Yeni aracı ekle");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Container className="bg-white" padding="md">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Container
          padding="none"
          className="flex-row items-center justify-between mb-4"
        >
          <Container padding="none" className="flex-row items-center">
            <Icon
              family="MaterialIcons"
              name="arrow-back"
              size={24}
              color="#67686A"
              pressable
              onPress={handleBack}
              containerClassName="mr-3"
            />
            <Typography
              variant="h3"
              weight="semibold"
              className="text-stock-dark"
            >
              Aracılar
            </Typography>
          </Container>
          <Icon
            family="MaterialIcons"
            name="add"
            size={24}
            color="#E3001B"
            pressable
            onPress={handleAddBroker}
          />
        </Container>

        {/* Search */}
        <SearchBar
          placeholder="Aracı ara..."
          onSearch={handleSearch}
          className="mb-4"
        />

        {/* Aracı Listesi */}
        <Container padding="none" className="space-y-2">
          {/* Örnek Aracı 1 */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border"
            radius="md"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container padding="none" className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Mehmet Özkan
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Tel: 0532 123 45 67 • Bölge: Gaziantep
                </Typography>
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-stock-text"
                >
                  Son İşlem: 15 Mart 2024
                </Typography>
              </Container>
              <Container padding="none" className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="phone"
                  size={16}
                  color="#67686A"
                  pressable
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={16}
                  color="#67686A"
                  pressable
                />
              </Container>
            </Container>
          </Card>

          {/* Örnek Aracı 2 */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border"
            radius="md"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container padding="none" className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Ali Yılmaz Ltd.
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Tel: 0216 987 65 43 • Bölge: İstanbul
                </Typography>
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-stock-text"
                >
                  Son İşlem: 20 Mart 2024
                </Typography>
              </Container>
              <Container padding="none" className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="phone"
                  size={16}
                  color="#67686A"
                  pressable
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={16}
                  color="#67686A"
                  pressable
                />
              </Container>
            </Container>
          </Card>

          {/* Örnek Aracı 3 */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border"
            radius="md"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container padding="none" className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Fatma Kaya
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Tel: 0544 321 98 76 • Bölge: Ankara
                </Typography>
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-stock-text"
                >
                  Son İşlem: 10 Mart 2024
                </Typography>
              </Container>
              <Container padding="none" className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="phone"
                  size={16}
                  color="#67686A"
                  pressable
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={16}
                  color="#67686A"
                  pressable
                />
              </Container>
            </Container>
          </Card>

          {/* Örnek Aracı 4 */}
          <Card
            variant="default"
            padding="sm"
            className="border border-stock-border"
            radius="md"
          >
            <Container
              padding="none"
              className="flex-row items-center justify-between"
            >
              <Container padding="none" className="flex-1">
                <Typography
                  variant="body"
                  weight="semibold"
                  className="text-stock-dark"
                >
                  Kuruyemiş Dünyası A.Ş.
                </Typography>
                <Typography
                  variant="caption"
                  size="sm"
                  className="text-stock-text mt-1"
                >
                  Tel: 0312 555 11 22 • Bölge: İzmir
                </Typography>
                <Typography
                  variant="caption"
                  size="xs"
                  className="text-stock-text"
                >
                  Son İşlem: 25 Mart 2024
                </Typography>
              </Container>
              <Container padding="none" className="flex-row items-center">
                <Icon
                  family="MaterialIcons"
                  name="phone"
                  size={16}
                  color="#67686A"
                  pressable
                  containerClassName="mr-2"
                />
                <Icon
                  family="MaterialIcons"
                  name="edit"
                  size={16}
                  color="#67686A"
                  pressable
                />
              </Container>
            </Container>
          </Card>
        </Container>

        {/* Yeni Aracı Ekle Butonu */}
        <Container padding="none" className="mt-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="bg-stock-red"
            onPress={handleAddBroker}
            leftIcon={
              <Icon family="MaterialIcons" name="add" size={20} color="white" />
            }
          >
            Yeni Aracı Ekle
          </Button>
        </Container>
      </ScrollView>
    </Container>
  );
}
