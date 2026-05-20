import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string, size: string, color: string) => void;
  updateQuantity: (itemId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalQuantity: number;
  deliveryCharges: number;
  total: number;
  paymentMethod: 'cod' | 'jazzcash';
  setPaymentMethod: (method: 'cod' | 'jazzcash') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash'>('cod');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.size === item.size && i.color === item.color
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string, size: string, color: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === itemId && i.size === size && i.color === color)));
  };

  const updateQuantity = (itemId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.id === itemId && i.size === size && i.color === color ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.quantity, 0);
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Delivery Rules:
  // If payment method is Cash on Delivery: Rs 180
  // Free delivery if: JazzCash advance OR 3+ products
  const deliveryCharges = (paymentMethod === 'jazzcash' || totalQuantity >= 3) ? 0 : 180;
  const total = subtotal + deliveryCharges;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalQuantity,
        deliveryCharges,
        total,
        paymentMethod,
        setPaymentMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
