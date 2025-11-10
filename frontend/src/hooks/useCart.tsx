// src/hooks/useCart.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MenuItem } from "../types"; // adjust path if needed

export type OrderType = "dine-in" | "takeaway" | null;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sentToKitchen?: boolean;
  department?: string;
}

interface CartContextValue {
  currentOrder: CartItem[];
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  addToOrder: (item: MenuItem) => void;
  updateQuantity: (id: string, delta: number, sentToKitchen?: boolean) => void;
  removeFromOrder: (id: string, sentToKitchen?: boolean) => void;
  clearOrder: () => void;
  getPendingItems: () => CartItem[];
  getAllCombinedItems: () => CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ defaultOrderType?: OrderType; children: React.ReactNode }> = ({
  defaultOrderType = null,
  children,
}) => {
  const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>(defaultOrderType);

  const addToOrder = useCallback((item: MenuItem) => {
    // if orderType not set, default to takeaway (keep parity with original OrdersPage behavior)
    setOrderType((prev) => prev ?? "takeaway");
    setCurrentOrder((prev) => {
      // try to combine only with items that are not sentToKitchen (preserve previous semantics)
      const existingIndex = prev.findIndex((p) => p.id === item.id && !p.sentToKitchen);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], quantity: copy[existingIndex].quantity + 1 };
        return copy;
      }
      const orderItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        sentToKitchen: false,
        department: (item as any).department,
      };
      return [...prev, orderItem];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number, sentToKitchen?: boolean) => {
    setCurrentOrder((prev) =>
      prev
        .map((it) => (it.id === id && it.sentToKitchen === sentToKitchen ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it))
        .filter((it) => it.quantity > 0)
    );
  }, []);

  const removeFromOrder = useCallback((id: string, sentToKitchen?: boolean) => {
    setCurrentOrder((prev) => prev.filter((it) => !(it.id === id && it.sentToKitchen === sentToKitchen)));
  }, []);

  const clearOrder = useCallback(() => {
    setCurrentOrder([]);
    setOrderType(null);
  }, []);

  const getPendingItems = useCallback(() => currentOrder.filter((it) => !it.sentToKitchen), [currentOrder]);

  const getAllCombinedItems = useCallback(() => {
    const map = new Map<string, CartItem>();
    currentOrder.forEach((it) => {
      const existing = map.get(it.id);
      if (existing) existing.quantity += it.quantity;
      else map.set(it.id, { ...it });
    });
    return Array.from(map.values());
  }, [currentOrder]);

  const subtotal = useMemo(() => getAllCombinedItems().reduce((s, i) => s + i.price * i.quantity, 0), [getAllCombinedItems]);
  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const value: CartContextValue = {
    currentOrder,
    orderType,
    setOrderType,
    addToOrder,
    updateQuantity,
    removeFromOrder,
    clearOrder,
    getPendingItems,
    getAllCombinedItems,
    subtotal,
    tax,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
