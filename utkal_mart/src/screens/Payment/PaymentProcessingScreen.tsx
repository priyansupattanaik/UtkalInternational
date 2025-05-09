// src/screens/Payment/PaymentProcessingScreen.tsx
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {BlurView} from '@react-native-community/blur';

const {width, height} = Dimensions.get('window');

// Memoized icon paths
const icons = {
  success: require('../../assets/images/icons/success.png'),
  truck: require('../../assets/images/pageicons/checkout.png'),
  calendar: require('../../assets/images/pageicons/arrow.png'),
};

const PaymentProcessingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    paymentMethod,
    subtotal,
    discount = 0,
    amount,
    address,
    items,
    promoCode,
  } = route.params || {};

  // State
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [processingText, setProcessingText] = useState('Processing payment...');
  const [orderNumber, setOrderNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Background image - memoized
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg1.png'),
    [],
  );

  // Generate random order number
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

  // Generate random future date
  const generateDeliveryDate = useCallback(() => {
    const today = new Date();
    const deliveryDays = Math.floor(Math.random() * 3) + 2; // 2-4 days
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + deliveryDays);
    return {
      date: futureDate.toLocaleDateString(),
      days: deliveryDays,
    };
  }, []);

  // Simulate payment processing
  useEffect(() => {
    // First update - payment processing
    setTimeout(() => {
      setProcessingText('Verifying payment details...');
    }, 1500);

    // Second update - payment verified
    setTimeout(() => {
      setProcessingText('Payment confirmed!');
      setPaymentComplete(true);
    }, 3000);

    // Third update - order processing
    setTimeout(() => {
      setProcessingText('Placing your order...');
    }, 4500);

    // Final update - order placed
    setTimeout(() => {
      // Generate order number and delivery date
      const newOrderNumber = generateOrderNumber();
      const delivery = generateDeliveryDate();

      setOrderNumber(newOrderNumber);
      setDeliveryDate(delivery.date);
      setOrderPlaced(true);
    }, 6000);
  }, [generateOrderNumber, generateDeliveryDate]);

  // Handle continue shopping
  const handleContinueShopping = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{name: 'TabNavigator'}],
    });
  }, [navigation]);

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

        {/* Payment Processing UI */}
        {!orderPlaced ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator
              size="large"
              color={paymentComplete ? '#34C759' : '#007AFF'}
              style={styles.processingIndicator}
            />
            <Text style={styles.processingText}>{processingText}</Text>
          </View>
        ) : null}

        {/* Order Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={orderPlaced}
          onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.successModalContainer}>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollViewContent}
                showsVerticalScrollIndicator={false}>
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

                <View style={styles.orderDetailsContainer}>
                  <View style={styles.orderDetail}>
                    <Text style={styles.orderDetailLabel}>Order Number:</Text>
                    <Text style={styles.orderDetailValue}>{orderNumber}</Text>
                  </View>

                  {/* Show subtotal */}
                  <View style={styles.orderDetail}>
                    <Text style={styles.orderDetailLabel}>Subtotal:</Text>
                    <Text style={styles.orderDetailValue}>
                      ₹{subtotal?.toFixed(2) || amount.toFixed(2)}
                    </Text>
                  </View>

                  {/* Show discount if applicable */}
                  {discount > 0 && (
                    <View style={styles.orderDetail}>
                      <Text style={styles.discountLabel}>Discount:</Text>
                      <Text style={styles.discountValue}>
                        -₹{discount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {/* Show promo code if applicable */}
                  {promoCode && (
                    <View style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>
                        Promo Applied:
                      </Text>
                      <Text style={styles.promoValue}>{promoCode}</Text>
                    </View>
                  )}

                  <View style={styles.orderDetail}>
                    <Text style={styles.orderDetailLabel}>Amount Paid:</Text>
                    <Text style={styles.orderDetailValue}>
                      ₹{amount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.orderDetail}>
                    <Text style={styles.orderDetailLabel}>Payment Method:</Text>
                    <Text style={styles.orderDetailValue}>
                      {paymentMethod.charAt(0).toUpperCase() +
                        paymentMethod.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Delivery Info */}
                <View style={styles.deliveryInfoContainer}>
                  <View style={styles.deliveryInfoRow}>
                    <Image
                      source={icons.truck}
                      style={styles.deliveryIcon}
                      tintColor="#007AFF"
                    />
                    <Text style={styles.deliveryInfoText}>
                      Expected Delivery
                    </Text>
                  </View>
                  <View style={styles.deliveryDateRow}>
                    <Image
                      source={icons.calendar}
                      style={styles.calendarIcon}
                      tintColor="rgba(255, 255, 255, 0.6)"
                    />
                    <Text style={styles.deliveryDateText}>{deliveryDate}</Text>
                  </View>
                </View>

                {/* Address Info */}
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Delivery Address:</Text>
                  <Text style={styles.addressText}>{address}</Text>
                </View>

                {/* Order Items */}
                <View style={styles.orderItemsSection}>
                  <Text style={styles.orderItemsTitle}>
                    Order Items ({items.length})
                  </Text>
                  <View style={styles.orderItemsList}>
                    {items.map(item => (
                      <View key={item.id} style={styles.orderItem}>
                        <Text style={styles.orderItemName} numberOfLines={1}>
                          {item.Product?.title || 'Product'}
                        </Text>
                        <View style={styles.orderItemDetails}>
                          <Text style={styles.orderItemQuantity}>
                            {item.quantity} × ₹{item.price}
                          </Text>
                          <Text style={styles.orderItemPrice}>
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={styles.thanksMessage}>
                  Thank you for shopping with us!
                </Text>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinueShopping}
                  activeOpacity={0.8}>
                  <Text style={styles.continueButtonText}>
                    Continue Shopping
                  </Text>
                </TouchableOpacity>
              </ScrollView>
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingIndicator: {
    marginBottom: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    width: width * 1,
    maxHeight: height * 1, // Limit max height to 85% of screen height
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    // borderRadius: 20,
    overflow: 'hidden', // Ensure content doesn't exceed rounded corners
  },
  modalScrollView: {
    width: '100%',
  },
  modalScrollViewContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  successIcon: {
    width: 40,
    height: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  orderDetailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 10,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  discountLabel: {
    fontSize: 14,
    color: '#34C759',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  promoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deliveryInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  deliveryInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deliveryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
  },
  calendarIcon: {
    width: 12,
    height: 12,
    marginRight: 6,
    opacity: 1,
  },
  deliveryDateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  addressInfo: {
    width: '100%',
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 14,
    color: 'white',
    marginBottom: 0,
  },
  addressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  orderItemsSection: {
    width: '100%',
    marginBottom: 10,
  },
  orderItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  orderItemsList: {
    width: '100%',
    maxHeight: undefined, // Remove height restriction
  },
  orderItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemQuantity: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  thanksMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
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
    marginTop: 5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default PaymentProcessingScreen;
