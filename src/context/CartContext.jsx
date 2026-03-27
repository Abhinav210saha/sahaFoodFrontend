import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);
const cartStorageKey = "saha-food-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem(cartStorageKey);
    return raw ? JSON.parse(raw) : [];
  });

  const persist = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
  };

  const addToCart = (item, quantity = 1) => {
    const safeQty = Math.max(1, Number(quantity) || 1);
    const existing = items.find((cartItem) => cartItem._id === item._id);
    if (existing) {
      const updated = items.map((cartItem) =>
        cartItem._id === item._id ? { ...cartItem, quantity: cartItem.quantity + safeQty } : cartItem
      );
      persist(updated);
      return;
    }
    persist([...items, { ...item, quantity: safeQty }]);
  };

  const updateQuantity = (id, quantity) => {
    const safeQty = Math.max(1, Number(quantity) || 1);
    persist(items.map((item) => (item._id === id ? { ...item, quantity: safeQty } : item)));
  };

  const removeFromCart = (id) => {
    persist(items.filter((item) => item._id !== id));
  };

  const clearCart = () => {
    persist([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount }),
    [items, totalItems, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
