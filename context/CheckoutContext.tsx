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
  latitude: number | null; // set when the user pins their location on the map
  longitude: number | null; // set when the user pins their location on the map
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
  latitude: null,
  longitude: null,
};

interface CheckoutContextValue {
  data: CheckoutData;
  updateData: (partial: Partial<CheckoutData>) => void;
  resetCheckout: () => void;
  logCheckoutData: () => void; // Add this for debugging
  validateCheckoutData: () => string[]; // Add this to validate before submission
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CheckoutData>(DEFAULT_DATA);

  const updateData = useCallback((partial: Partial<CheckoutData>) => {
    setData((prev) => {
      const newData = { ...prev, ...partial };
      
      // Log when coordinates are being updated
      if (partial.latitude !== undefined || partial.longitude !== undefined) {
        console.log("[CHECKOUT CONTEXT] Coordinates updated:", {
          latitude: newData.latitude,
          longitude: newData.longitude,
          address: newData.address,
          previousLatitude: prev.latitude,
          previousLongitude: prev.longitude,
        });
      }
      
      // Log when address is being updated
      if (partial.address !== undefined) {
        console.log("[CHECKOUT CONTEXT] Address updated:", {
          address: newData.address,
          latitude: newData.latitude,
          longitude: newData.longitude,
        });
      }
      
      return newData;
    });
  }, []);

  const resetCheckout = useCallback(() => {
    console.log("[CHECKOUT CONTEXT] Resetting checkout data");
    setData(DEFAULT_DATA);
  }, []);

  // Add logging helper
  const logCheckoutData = useCallback(() => {
    console.log("====================================");
    console.log("[CHECKOUT CONTEXT] Current Checkout Data:");
    console.log("------------------------------------");
    console.log("Address:", data.address);
    console.log("Contact Number:", data.contactNumber);
    console.log("Delivery Type:", data.deliveryType);
    console.log("Note:", data.note);
    console.log("Payment Method:", data.paymentMethod);
    console.log("Bank Detail:", data.bankDetail ? "Loaded" : "Not loaded");
    console.log("Screenshot URI:", data.screenshotUri || "None");
    console.log("Screenshot Base64:", data.screenshotBase64 ? "Present" : "None");
    console.log("Latitude:", data.latitude);
    console.log("Longitude:", data.longitude);
    console.log("Has Coordinates:", data.latitude !== null && data.longitude !== null);
    console.log("====================================");
  }, [data]);

  // Add validation helper
  const validateCheckoutData = useCallback(() => {
    const errors: string[] = [];
    
    if (!data.address.trim()) {
      errors.push("Address is required");
    }
    
    if (!data.contactNumber.trim()) {
      errors.push("Contact number is required");
    }
    
    if (data.paymentMethod === "IBFT" && !data.screenshotBase64) {
      errors.push("Payment screenshot is required for IBFT");
    }
    
    // Check if coordinates are present (they should be for delivery)
    if (data.latitude === null || data.longitude === null) {
      console.warn("[CHECKOUT CONTEXT] Warning: No coordinates pinned for delivery");
      // Don't block submission, but warn about it
      // errors.push("Please pin your location for delivery");
    } else {
      console.log("[CHECKOUT CONTEXT] Coordinates valid:", {
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
    
    console.log("[CHECKOUT CONTEXT] Validation errors:", errors);
    return errors;
  }, [data]);

  return (
    <CheckoutContext.Provider 
      value={{ 
        data, 
        updateData, 
        resetCheckout, 
        logCheckoutData,
        validateCheckoutData 
      }}
    >
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