import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartItem, Product, UserSession } from '../types';
import { spawnFlyToBagParticle } from '../lib/animations';

interface ToastMessage {
  id: string;
  text: string;
}

interface StoreContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    size: string,
    color: string,
    quantity?: number,
    sourceEl?: HTMLElement | null
  ) => void;
  updateCartQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  showToast: (text: string) => void;
  toasts: ToastMessage[];
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dh_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dh_cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dh_wishlist');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [user, setUserState] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('dh_user');
      return saved ? (JSON.parse(saved) as UserSession) : null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminTokenState] = useState<string | null>(() => {
    return localStorage.getItem('dh_admin_token');
  });

  const [isCartOpen, setCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dh_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dh_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('dh_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const showToast = useCallback((text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const addToCart = useCallback(
    (
      product: Product,
      size: string,
      color: string,
      quantity = 1,
      sourceEl?: HTMLElement | null
    ) => {
      if (!product.inStock || product.stock <= 0) {
        showToast('This piece is currently sold out.');
        return;
      }
      spawnFlyToBagParticle(sourceEl);
      const key = `${product.id}__${size}__${color}`;
      setCart((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            size,
            color,
            quantity,
            image: product.images[0] || 'tee_acid_wash_obsidian',
          },
        ];
      });
      showToast(`Added ${product.name} (${size}) to bag`);
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.key !== key));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity } : item))
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
        return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const setUser = useCallback((u: UserSession | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('dh_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('dh_user');
    }
  }, []);

  const setAdminToken = useCallback((token: string | null) => {
    setAdminTokenState(token);
    if (token) {
      localStorage.setItem('dh_admin_token', token);
    } else {
      localStorage.removeItem('dh_admin_token');
    }
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        cart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlisted,
        quickViewProduct,
        setQuickViewProduct,
        user,
        setUser,
        adminToken,
        setAdminToken,
        showToast,
        toasts,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
