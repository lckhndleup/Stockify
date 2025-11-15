// app/broker-visits/lib/VisitCard.tsx
import React, { useState } from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Card, Typography, Icon, Modal } from "@/src/components/ui";
import { useUpdateBrokerVisit } from "@/src/hooks/api";
import { useToast } from "@/src/hooks/useToast";
import type { TodayBrokerVisitItem, BrokerVisitStatus } from "@/src/types/broker";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/RootNavigator';

interface VisitCardProps {
  visit: TodayBrokerVisitItem;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit }) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState(visit.visitInfo?.note || "");
  const [selectedStatus, setSelectedStatus] = useState<BrokerVisitStatus | null>(null);
  const { mutate: updateVisit, isPending } = useUpdateBrokerVisit();
  const { showToast } = useToast();

  const status = visit.visitInfo?.status;
  const orderNo = visit.orderNo || 0;

  const getStatusInfo = () => {
    switch (status) {
      case "VISITED":
        return {
          icon: "check-circle",
          color: "#16A34A",
          bgColor: "bg-green-100",
          label: "Ziyaret Edildi",
        };
      case "SKIPPED":
        return {
          icon: "block",
          color: "#6B7280",
          bgColor: "bg-gray-200",
          label: "Atlandı",
        };
      default:
        return {
          icon: "schedule",
          color: "#F97316",
          bgColor: "bg-orange-100",
          label: "Bekliyor",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleStatusChange = (newStatus: BrokerVisitStatus) => {
    setSelectedStatus(newStatus);
    if (newStatus === "SKIPPED" || note) {
      setShowNoteModal(true);
    } else {
      updateVisitStatus(newStatus, "");
    }
  };

  const updateVisitStatus = (newStatus: BrokerVisitStatus, visitNote: string) => {
    updateVisit(
      {
        brokerId: visit.brokerId,
        status: newStatus,
        note: visitNote || undefined,
      },
      {
        onSuccess: () => {
          showToast("Ziyaret durumu güncellendi", "success");
          setShowNoteModal(false);
        },
        onError: () => {
          showToast("Güncelleme başarısız oldu", "error");
        },
      },
    );
  };

  const handleNoteSubmit = () => {
    if (selectedStatus) {
      updateVisitStatus(selectedStatus, note);
    }
  };

  const handleBrokerPress = () => {
    router.push({
      pathname: "/broker/brokerDetail",
      params: { brokerId: visit.brokerId.toString() },
    });
  };

  return (
    <>
      <Card variant="elevated" padding="none">
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="bg-red-600 rounded-full w-10 h-10 items-center justify-center">
                <Typography variant="body" weight="bold" className="text-white">
                  {orderNo}
                </Typography>
              </View>
              <TouchableOpacity onPress={handleBrokerPress} className="flex-1">
                <Typography variant="body" weight="bold" className="text-gray-900">
                  {visit.firstName} {visit.lastName}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {visit.targetDayOfWeek}
                </Typography>
              </TouchableOpacity>
            </View>
            <View className={`${statusInfo.bgColor} rounded-full px-3 py-1`}>
              <View className="flex-row items-center gap-1">
                <Icon
                  family="MaterialIcons"
                  name={statusInfo.icon}
                  size={16}
                  color={statusInfo.color}
                />
                <Typography variant="caption" style={{ color: statusInfo.color }}>
                  {statusInfo.label}
                </Typography>
              </View>
            </View>
          </View>

          {/* Note */}
          {visit.visitInfo?.note && (
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
              <Typography variant="caption" className="text-gray-600">
                Not: {visit.visitInfo.note}
              </Typography>
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleStatusChange("VISITED")}
              disabled={isPending || status === "VISITED"}
              className="flex-1"
              activeOpacity={0.7}
            >
              <View
                className={`p-3 rounded-lg items-center ${
                  status === "VISITED" ? "bg-green-600" : "bg-green-100"
                }`}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  className={status === "VISITED" ? "text-white" : "text-green-700"}
                >
                  Ziyaret Et
                </Typography>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleStatusChange("SKIPPED")}
              disabled={isPending || status === "SKIPPED"}
              className="flex-1"
              activeOpacity={0.7}
            >
              <View
                className={`p-3 rounded-lg items-center ${
                  status === "SKIPPED" ? "bg-gray-600" : "bg-gray-200"
                }`}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  className={status === "SKIPPED" ? "text-white" : "text-gray-700"}
                >
                  Atla
                </Typography>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Note Modal */}
      <Modal visible={showNoteModal} onClose={() => setShowNoteModal(false)} title="Not Ekle">
        <View className="gap-4">
          <Typography variant="body" className="text-gray-600">
            Bu ziyaret için not eklemek ister misiniz?
          </Typography>

          <View className="border border-gray-300 rounded-lg p-3">
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Not yazın..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-gray-900"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowNoteModal(false)}
              className="flex-1 bg-gray-200 p-3 rounded-lg"
              activeOpacity={0.7}
            >
              <Typography variant="body" weight="semibold" className="text-gray-700 text-center">
                İptal
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNoteSubmit}
              disabled={isPending}
              className="flex-1 bg-red-600 p-3 rounded-lg"
              activeOpacity={0.7}
            >
              <Typography variant="body" weight="semibold" className="text-white text-center">
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};
