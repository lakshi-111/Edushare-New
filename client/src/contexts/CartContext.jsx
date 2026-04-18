import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('edushare_cart');
    return saved ? JSON.parse(saved) : [];
  });

  function sync(nextItems) {
    setItems(nextItems);
    localStorage.setItem('edushare_cart', JSON.stringify(nextItems));
  }

  const value = useMemo(
    () => ({
      items,
      totalItems: items.length,
      totalPrice: items.reduce((sum, item) => sum + Number(item.price || 0), 0),
      addToCart: (resource) => {
        if (items.some((item) => item._id === resource._id)) return;
        sync([...items, resource]);
      },
      removeFromCart: (resourceId) => sync(items.filter((item) => item._id !== resourceId)),
      clearCart: () => sync([])
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
