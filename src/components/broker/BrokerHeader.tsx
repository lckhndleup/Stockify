import React from "react";
import { View } from "react-native";
import { Typography } from "@/src/components/ui";

export interface BrokerHeaderProps {
  name: string;
  surname: string;
  balance: number;
}

export const BrokerHeader: React.FC<BrokerHeaderProps> = ({ name, surname, balance }) => {
  const isPositiveBalance = balance >= 0;
  const formattedBalance = Math.abs(balance).toLocaleString();

  return (
    <View className="items-center mb-4">
      <Typography
        variant="h1"
        size="3xl"
        weight="bold"
        className="text-stock-black text-center"
      >
        {`${name} ${surname}`}
      </Typography>
      <Typography
        variant="body"
        weight="semibold"
        className={`${isPositiveBalance ? "text-stock-red" : "text-stock-green"} text-center mt-0`}
      >
        Bakiye: {isPositiveBalance ? "" : "-"}₺{formattedBalance}
      </Typography>
    </View>
  );
};

export default BrokerHeader;
