import { MobBankDetail } from "@/services/api";
import React, { createContext, useCallback, useContext, useState } from "react";

export type DeliveryType = "Normal Delivery" | "Urgent Delivery";
export type PaymentMethod = "Cash On Delivery" | "IBFT";

export interface CheckoutData {
  address: string;
  contactNumber: string;
  deliveryType: DeliveryType;
  note: string;
  paymentMethod: PaymentMethod;
  bankDetail: MobBankDetail | null; // fetched from GetBankDetail, read-only
  screenshotUri: string | null;
  screenshotBase64: string | null;
}

const DEFAULT_DATA: CheckoutData = {
  address: "",
  contactNumber: "",
  deliveryType: "Normal Delivery",
  note: "",
  paymentMethod: "Cash On Delivery",
  bankDetail: null,
  screenshotUri: null,
  screenshotBase64: null,
};

interface CheckoutContextValue {
  data: CheckoutData;
  updateData: (partial: Partial<CheckoutData>) => void;
  resetCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CheckoutData>(DEFAULT_DATA);

  const updateData = useCallback((partial: Partial<CheckoutData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetCheckout = useCallback(() => {
    setData(DEFAULT_DATA);
  }, []);

  return (
    <CheckoutContext.Provider value={{ data, updateData, resetCheckout }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx)
    throw new Error("useCheckout must be used within a CheckoutProvider");
  return ctx;
}
