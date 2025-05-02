import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import {Alert} from 'react-native';
import API_CONFIG from '../components/config';
import {useAuth} from './AuthContext';

// Define types
type CartItem = {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  Product?: {
    id: string;
    title: string;
    image: string;
    price: number;
    sellerName?: string;
  };
};

type CartContextType = {
  cartItems: CartItem[];
  cartTotal: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
  processingItemId: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string) => Promise<boolean>;
  updateCartItemQuantity: (
    itemId: string,
    newQuantity: number,
  ) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
};

// Create Cart Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart Provider component
export const CartProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {token} = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [itemCount, setItemCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);

  // API endpoint
  const cartEndpoint = `${API_CONFIG.BASE_URL}/api/buyer/cart`;

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!token) {
      setCartItems([]);
      setCartTotal(0);
      setItemCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(cartEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();

      setCartItems(data.items || []);
      setCartTotal(parseFloat(data.total) || 0);
      setItemCount(data.itemCount || 0);
    } catch (error) {
      console.error(
        'Error fetching cart:',
        error instanceof Error ? error.message : String(error),
      );
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setLoading(false);
    }
  }, [cartEndpoint, token]);

  // Add to cart function
  const addToCart = async (productId: string) => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to add items to your cart');
      return false;
    }

    setProcessingItemId(productId);

    try {
      const response = await fetch(cartEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error adding item to cart');
      }

      await response.json();
      // Refresh cart data after adding
      await fetchCart();
      return true;
    } catch (error) {
      console.error(
        'Add to cart error:',
        error instanceof Error ? error.message : String(error),
      );
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add item to cart',
      );
      return false;
    } finally {
      setProcessingItemId(null);
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (
    itemId: string,
    newQuantity: number,
  ) => {
    if (!token) return false;

    // Don't allow quantities less than 1
    if (newQuantity < 1) return false;

    setProcessingItemId(itemId);

    try {
      const response = await fetch(`${cartEndpoint}/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({quantity: newQuantity}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating cart');
      }

      // Refresh cart after update
      await fetchCart();
      return true;
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to update item quantity',
      );
      return false;
    } finally {
      setProcessingItemId(null);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    if (!token) return false;

    setProcessingItemId(itemId);
    try {
      const response = await fetch(`${cartEndpoint}/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error removing item from cart');
      }

      // Refresh cart after deletion
      await fetchCart();
      return true;
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to remove item from cart',
      );
      return false;
    } finally {
      setProcessingItemId(null);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!token) return false;

    setLoading(true);
    try {
      const response = await fetch(`${cartEndpoint}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error clearing cart');
      }

      // Refresh cart after clearing
      await fetchCart();
      return true;
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to clear cart',
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load cart data when token changes
  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      // Clear cart if not logged in
      setCartItems([]);
      setCartTotal(0);
      setItemCount(0);
    }
  }, [token, fetchCart]);

  const value: CartContextType = {
    cartItems,
    cartTotal,
    itemCount,
    loading,
    error,
    processingItemId,
    fetchCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
