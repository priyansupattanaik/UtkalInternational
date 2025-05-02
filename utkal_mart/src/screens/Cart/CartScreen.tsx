import React, {useCallback, useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useCart} from '../../context/CartContext';
import API_CONFIG from '../../components/config';
import {BlurView} from '@react-native-community/blur';

// Memoized icon paths
const icons = {
  back: require('../../assets/images/pageicons/arrow.png'),
  trash: require('../../assets/images/pageicons/trash.png'),
  alert: require('../../assets/images/icons/alert.png'),
  cart: require('../../assets/images/tabicons/cart.png'),
  checkout: require('../../assets/images/pageicons/checkout.png'),
  success: require('../../assets/images/icons/success.png'),
};

const {width} = Dimensions.get('window');

const CartScreen = () => {
  const navigation = useNavigation();
  const {token} = useAuth();

  // State for success modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Cart context
  const {
    cartItems,
    cartTotal,
    itemCount,
    loading,
    error,
    processingItemId,
    fetchCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Background image
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg1.png'),
    [],
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    fetchCart();
  }, [fetchCart]);

  // Confirm and remove item from cart
  const confirmRemoveFromCart = useCallback(
    itemId => {
      if (!token) return;

      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeFromCart(itemId),
          },
        ],
      );
    },
    [token, removeFromCart],
  );

  // Confirm and clear entire cart
  const confirmClearCart = useCallback(() => {
    if (!token) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from your cart?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ],
    );
  }, [token, clearCart]);

  // Generate a random order number
  const generateOrderNumber = useCallback(() => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }, []);

  // Handle successful order
  const handleOrderSuccess = useCallback(() => {
    const newOrderNumber = generateOrderNumber();
    setOrderNumber(newOrderNumber);
    setSuccessModalVisible(true);
    clearCart();
  }, [generateOrderNumber, clearCart]);

  // Process checkout
  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Add items before checkout.',
      );
      return;
    }

    Alert.alert('Checkout', 'Proceed to checkout and payment?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Proceed',
        onPress: () => {
          // Simulate payment processing
          setTimeout(() => {
            const checkedOutItems = [...cartItems];
            handleOrderSuccess();
            navigation.navigate('Profile', {
              checkedOutItems: checkedOutItems,
            });
          }, 1500);
        },
      },
    ]);
  }, [cartItems, handleOrderSuccess, navigation]);

  // Close success modal and navigate to home
  const handleContinueShopping = useCallback(() => {
    setSuccessModalVisible(false);
    navigation.navigate('Home');
  }, [navigation]);

  // Navigation handler
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Navigate to home
  const navigateToHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // Render cart item (memoized)
  const renderCartItem = useCallback(
    ({item}) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      const isProcessing = processingItemId === item.id;

      return (
        <View style={styles.cartItemContainer}>
          <View style={styles.cartItemContent}>
            {/* Product Image */}
            <View style={styles.productImageContainer}>
              <Image
                source={{
                  uri: item.Product?.image
                    ? item.Product.image.startsWith('http')
                      ? item.Product.image
                      : `${API_CONFIG.BASE_URL}${item.Product.image}`
                    : null,
                }}
                style={styles.productImage}
                defaultSource={require('../../assets/images/producticons/All.png')}
              />
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.Product?.title || 'Product'}
              </Text>

              <Text style={styles.sellerName}>
                Seller: {item.Product?.sellerName || 'Unknown'}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <Text style={styles.itemTotal}>
                  Total: ₹{itemTotal.toFixed(2)}
                </Text>
              </View>

              {/* Quantity Control */}
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    {opacity: isProcessing ? 0.5 : 1},
                  ]}
                  onPress={() =>
                    updateCartItemQuantity(item.id, item.quantity - 1)
                  }
                  disabled={isProcessing}
                  activeOpacity={0.7}>
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>

                <View style={styles.quantityTextContainer}>
                  <Text style={styles.quantityText}>
                    {isProcessing ? '...' : item.quantity}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    {opacity: isProcessing ? 0.5 : 1},
                  ]}
                  onPress={() =>
                    updateCartItemQuantity(item.id, item.quantity + 1)
                  }
                  disabled={isProcessing}
                  activeOpacity={0.7}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.deleteButton, {opacity: isProcessing ? 0.5 : 1}]}
              onPress={() => confirmRemoveFromCart(item.id)}
              disabled={isProcessing}
              activeOpacity={0.7}>
              <Image
                source={icons.trash}
                style={styles.deleteIcon}
                tintColor="#FF3B30"
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [processingItemId, updateCartItemQuantity, confirmRemoveFromCart],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ImageBackground
        source={backgroundImage}
        style={styles.container}
        resizeMode="cover">
        {/* Background overlay with blur effect */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={styles.overlayBackground}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
          />
        ) : (
          <View style={styles.overlayBackground} />
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}>
            <Image
              source={icons.back}
              style={styles.backIcon}
              tintColor="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>MY CART</Text>

          {cartItems.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={confirmClearCart}
              activeOpacity={0.7}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cart Content */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <Image
                source={icons.alert}
                style={styles.alertIcon}
                tintColor="#FF3B30"
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchCart}
                activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <View style={styles.emptyCartCard}>
              <Image
                source={icons.cart}
                style={styles.emptyCartIcon}
                tintColor="rgba(255, 255, 255, 0.4)"
              />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={navigateToHome}
                activeOpacity={0.8}>
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.cartList}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
            ItemSeparatorComponent={() => <View style={{height: 8}} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Bottom Totals Section */}
        {cartItems.length > 0 && (
          <View style={styles.totalsContainer}>
            <View style={styles.totalsContent}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Items</Text>
                <Text style={styles.totalValue}>{itemCount}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.cartTotalText}>
                  ₹{cartTotal.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
                activeOpacity={0.8}>
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={successModalVisible}
          onRequestClose={() => setSuccessModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.successModalContainer}>
              <View style={styles.successIconContainer}>
                <Image
                  source={icons.success}
                  style={styles.successIcon}
                  tintColor="#34C759"
                />
              </View>

              <Text style={styles.successTitle}>Order Successful!</Text>

              <Text style={styles.successMessage}>
                Your order has been placed successfully.
              </Text>

              <View style={styles.orderNumberContainer}>
                <Text style={styles.orderNumberLabel}>Order Number:</Text>
                <Text style={styles.orderNumberValue}>{orderNumber}</Text>
              </View>

              <Text style={styles.thanksMessage}>
                Thank you for shopping with us!
              </Text>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueShopping}
                activeOpacity={0.8}>
                <Text style={styles.continueButtonText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 58, 48, 0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  cartList: {
    paddingHorizontal: 16,
    paddingBottom: 270, // Extra space for bottom total section
  },
  cartItemContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.75)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cartItemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemTotal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  quantityTextContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: 6,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  errorCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.75)',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  alertIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  emptyCartCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.75)',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  emptyCartIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  shopButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 78,
  },
  totalsContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cartTotalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    width: width * 0.85,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  successIcon: {
    width: 40,
    height: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  orderNumberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  orderNumberLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  orderNumberValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  thanksMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default CartScreen;
