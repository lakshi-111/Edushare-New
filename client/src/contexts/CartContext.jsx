import { createContext, useContext, useMemo, useState } from 'react';
import api from '../utils/api';

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
      addToCart: async (resource) => {
        if (items.some((item) => item._id === resource._id)) return;
        sync([...items, resource]);
        
        // Create notification for cart update
        try {
          await api.post('/notifications/cart-notification', {
            resourceTitle: resource.title,
            resourcePrice: resource.price || 0
          });
        } catch (error) {
          console.error('Failed to create cart notification:', error);
        }
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
