// src/screens/Cart/CartScreen.tsx
import React, {useCallback, useState, useMemo, useEffect} from 'react';
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
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useCart} from '../../context/CartContext';
import API_CONFIG from '../../components/config';
import {BlurView} from '@react-native-community/blur';

// Get dimensions once
const {width, height} = Dimensions.get('window');

// Memoized icon paths
const icons = {
  back: require('../../assets/images/pageicons/arrow.png'),
  trash: require('../../assets/images/pageicons/trash.png'),
  alert: require('../../assets/images/icons/alert.png'),
  cart: require('../../assets/images/tabicons/cart.png'),
  checkout: require('../../assets/images/pageicons/checkout.png'),
  success: require('../../assets/images/icons/success.png'),
  promo: require('../../assets/images/pageicons/promo.png'),
  close: require('../../assets/images/icons/close.png'),
};

// Sample promo codes - in a real app you would fetch these from your API
const availablePromoCodes = [
  {
    id: '1',
    code: 'WELCOME20',
    discount: 20, // Percentage discount
    description: '20% off on your first order',
    expiryDate: '2025-12-31',
    minimumAmount: 500,
  },
  {
    id: '2',
    code: 'SUMMER10',
    discount: 10,
    description: '10% off on all summer products',
    expiryDate: '2025-09-30',
    minimumAmount: 200,
  },
  {
    id: '3',
    code: 'FLAT100',
    discount: 100, // Fixed amount discount
    description: '₹100 off on orders above ₹1000',
    expiryDate: '2025-06-30',
    minimumAmount: 1000,
    isFixed: true,
  },
];

const CartScreen = () => {
  const navigation = useNavigation();
  const {token} = useAuth();

  // State for modals
  const [promoCodeModalVisible, setPromoCodeModalVisible] = useState(false);
  const [checkedOutItems, setCheckedOutItems] = useState([]);

  // State for promo code
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');

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

  // Background image - memoized
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg1.png'),
    [],
  );

  // Set final total whenever cartTotal or discount changes
  useEffect(() => {
    if (appliedPromoCode) {
      // Recalculate discount amount
      calculateDiscount(appliedPromoCode);
    } else {
      setFinalTotal(cartTotal);
    }
  }, [cartTotal, appliedPromoCode]);

  // Calculate discount based on promo code
  const calculateDiscount = useCallback(
    promoCode => {
      let discount = 0;

      if (cartTotal < promoCode.minimumAmount) {
        setPromoCodeError(
          `Minimum order amount of ₹${promoCode.minimumAmount} required`,
        );
        setAppliedPromoCode(null);
        setDiscountAmount(0);
        setFinalTotal(cartTotal);
        return;
      }

      if (promoCode.isFixed) {
        // Fixed amount discount
        discount = promoCode.discount;
      } else {
        // Percentage discount
        discount = (cartTotal * promoCode.discount) / 100;
      }

      // Cap discount to not exceed cart total
      discount = Math.min(discount, cartTotal);

      setDiscountAmount(discount);
      setFinalTotal(cartTotal - discount);
      setPromoCodeError('');
    },
    [cartTotal],
  );

  // Apply promo code
  const applyPromoCode = useCallback(
    promoCode => {
      setAppliedPromoCode(promoCode);
      calculateDiscount(promoCode);
      setPromoCodeModalVisible(false);
    },
    [calculateDiscount],
  );

  // Remove applied promo code
  const removePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setFinalTotal(cartTotal);
    setPromoCodeError('');
  }, [cartTotal]);

  // Handle manual promo code input
  const handlePromoCodeSubmit = useCallback(() => {
    if (!promoCodeInput.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    // Find the promo code in available codes
    const promoCode = availablePromoCodes.find(
      code => code.code === promoCodeInput.trim().toUpperCase(),
    );

    if (!promoCode) {
      setPromoCodeError('Invalid promo code');
      return;
    }

    applyPromoCode(promoCode);
    setPromoCodeInput('');
  }, [promoCodeInput, applyPromoCode]);

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
          onPress: () => {
            clearCart();
            removePromoCode();
          },
        },
      ],
    );
  }, [token, clearCart, removePromoCode]);

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
          // Navigate to PaymentScreen with cart details and promo
          navigation.navigate('PaymentScreen', {
            items: cartItems,
            subtotal: cartTotal,
            discount: discountAmount,
            finalTotal: finalTotal,
            promoCode: appliedPromoCode ? appliedPromoCode.code : null,
          });
        },
      },
    ]);
  }, [
    cartItems,
    cartTotal,
    discountAmount,
    finalTotal,
    appliedPromoCode,
    navigation,
  ]);

  // Modal handlers
  const openPromoCodeModal = useCallback(() => {
    setPromoCodeModalVisible(true);
  }, []);

  const closePromoCodeModal = useCallback(() => {
    setPromoCodeModalVisible(false);
  }, []);

  // Navigation handler
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Navigate to home
  const navigateToHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // Render promo code item
  const renderPromoCodeItem = useCallback(
    ({item}) => {
      const isApplicable = cartTotal >= item.minimumAmount;

      return (
        <TouchableOpacity
          style={[
            styles.promoCodeItem,
            !isApplicable && styles.promoCodeItemDisabled,
          ]}
          onPress={() => isApplicable && applyPromoCode(item)}
          disabled={!isApplicable}
          activeOpacity={0.7}>
          <View style={styles.promoCodeHeader}>
            <View style={styles.promoCodeBadge}>
              <Text style={styles.promoCodeBadgeText}>{item.code}</Text>
            </View>
            {isApplicable ? (
              <Text style={styles.applyText}>Apply</Text>
            ) : (
              <Text style={styles.minimumAmountText}>
                Min: ₹{item.minimumAmount}
              </Text>
            )}
          </View>

          <Text style={styles.promoCodeDescription}>{item.description}</Text>

          <Text style={styles.promoCodeExpiry}>
            Valid till: {new Date(item.expiryDate).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      );
    },
    [cartTotal, applyPromoCode],
  );

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
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
              </View>

              {/* Applied Promo Code Section */}
              {appliedPromoCode ? (
                <View style={styles.appliedPromoContainer}>
                  <View style={styles.appliedPromoRow}>
                    <View style={styles.appliedPromoInfo}>
                      <Text style={styles.appliedPromoLabel}>
                        Applied Promo:
                      </Text>
                      <Text style={styles.appliedPromoCode}>
                        {appliedPromoCode.code}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePromoButton}
                      onPress={removePromoCode}
                      activeOpacity={0.7}>
                      <Image
                        source={icons.close}
                        style={styles.removePromoIcon}
                        tintColor="#FF3B30"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.discountLabel}>Discount</Text>
                    <Text style={styles.discountValue}>
                      -₹{discountAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.promoButton}
                  onPress={openPromoCodeModal}
                  activeOpacity={0.7}>
                  <Image
                    source={icons.promo}
                    style={styles.promoIcon}
                    tintColor="#007AFF"
                  />
                  <Text style={styles.promoButtonText}>Apply Promo Code</Text>
                </TouchableOpacity>
              )}

              {promoCodeError ? (
                <Text style={styles.promoErrorText}>{promoCodeError}</Text>
              ) : null}

              <View style={[styles.totalRow, styles.finalTotalRow]}>
                <Text style={styles.finalTotalLabel}>Total Amount</Text>
                <Text style={styles.cartTotalText}>
                  ₹{finalTotal.toFixed(2)}
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

        {/* Additional blur overlay for modals */}
        {promoCodeModalVisible && <View style={styles.modalBackdrop} />}

        {/* Promo Code Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={promoCodeModalVisible}
          onRequestClose={closePromoCodeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.promoModalContainer}>
              <View style={styles.promoModalHeader}>
                <Text style={styles.promoModalTitle}>
                  Available Promo Codes
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closePromoCodeModal}
                  activeOpacity={0.7}>
                  <Image
                    source={icons.close}
                    style={styles.closeIcon}
                    tintColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Manual Promo Code Input */}
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter promo code"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={promoCodeInput}
                  onChangeText={setPromoCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.promoSubmitButton}
                  onPress={handlePromoCodeSubmit}
                  activeOpacity={0.7}>
                  <Text style={styles.promoSubmitText}>Apply</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {availablePromoCodes.length > 0 ? (
                <FlatList
                  data={availablePromoCodes}
                  renderItem={renderPromoCodeItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.promoCodeList}
                  ItemSeparatorComponent={() => <View style={{height: 10}} />}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noPromoContainer}>
                  <Text style={styles.noPromoText}>
                    No promo codes available at the moment
                  </Text>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  clearButton: {
    backgroundColor: 'rgba(250, 12, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  cartList: {
    paddingHorizontal: 16,
    paddingBottom: 370, // Extra space for bottom total section
  },
  cartItemContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cartItemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    width: 70,
    height: 70,
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
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemTotal: {
    fontSize: 14,
    color: 'rgb(255, 255, 255)',
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
    backgroundColor: 'rgba(0, 123, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    // lineHeight: 20,
  },
  quantityTextContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    marginHorizontal: 8,
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
    backgroundColor: 'rgba(250, 12, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  deleteIcon: {
    width: 24,
    height: 24,
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
    borderRadius: 30,
  },
  emptyCartCard: {
    alignItems: 'center',
  },
  emptyCartIcon: {
    width: 52,
    height: 52,
    opacity: 1,
    marginBottom: 16,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  totalsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 78,
    zIndex: 2,
  },
  totalsContent: {
    padding: 16,
    // paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cartTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // Promo Code styles
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  promoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  promoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  promoErrorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  appliedPromoContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  appliedPromoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedPromoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  appliedPromoCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  removePromoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 13, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  removePromoIcon: {
    width: 12,
    height: 12,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  finalTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
  },
  totalLabel: {
    color: 'white',
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Promo Code Modal styles
  promoModalContainer: {
    width: width * 0.91,
    backgroundColor: 'rgb(30, 30, 30)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    maxHeight: height * 0.8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 3,
  },
  promoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 13, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  promoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 10,
  },
  promoSubmitButton: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  promoSubmitText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  promoCodeList: {
    paddingTop: 0,
  },
  promoCodeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
  },
  promoCodeItemDisabled: {
    opacity: 0.6,
  },
  promoCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoCodeBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoCodeBadgeText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  applyText: {
    color: '#34C759',
    fontWeight: '800',
    fontSize: 14,
  },
  minimumAmountText: {
    color: '#FF9500',
    fontSize: 14,
  },
  promoCodeDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  promoCodeExpiry: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  noPromoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noPromoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontSize: 14,
  },

  checkoutButton: {
    marginTop: 4,
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

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
});

export default CartScreen;
