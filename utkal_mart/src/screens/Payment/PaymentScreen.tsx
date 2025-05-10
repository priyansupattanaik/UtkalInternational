// src/screens/Payment/PaymentScreen.tsx
import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useCart} from '../../context/CartContext';
import {BlurView} from '@react-native-community/blur';

const {width, height} = Dimensions.get('window');

// Memoized icon paths
const icons = {
  back: require('../../assets/images/pageicons/arrow.png'),
  location: require('../../assets/images/pageicons/arrow.png'),
  upi: require('../../assets/images/pageicons/upi.png'),
  card: require('../../assets/images/pageicons/card.png'),
  netbanking: require('../../assets/images/pageicons/netbanking.png'),
  close: require('../../assets/images/icons/close.png'),
  check: require('../../assets/images/icons/success.png'),
};

// Payment methods
const PAYMENT_METHODS = {
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
};

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {user} = useAuth();
  const {cartItems} = useCart();

  // Get params from the route passed from CartScreen
  const {
    items = cartItems,
    subtotal,
    discount = 0,
    finalTotal,
    promoCode,
  } = route.params || {};

  // State management
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
    bankName: '',
  });

  // Background image - memoized
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg1.png'),
    [],
  );

  // Calculate final amount - use finalTotal from route params if available, otherwise use cartTotal
  const finalAmount = useMemo(() => {
    return finalTotal || subtotal - discount;
  }, [finalTotal, subtotal, discount]);

  // Handle back button
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Open payment modal
  const handlePaymentMethodSelect = useCallback(method => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  }, []);

  // Close payment modal
  const handleCloseModal = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  // Handle UPI input change
  const handleUpiInputChange = useCallback(text => {
    setPaymentDetails(prev => ({...prev, upiId: text}));
  }, []);

  // Handle card input changes
  const handleCardInputChange = useCallback((field, text) => {
    setPaymentDetails(prev => ({...prev, [field]: text}));
  }, []);

  // Handle bank selection
  const handleBankSelect = useCallback(bankName => {
    setPaymentDetails(prev => ({...prev, bankName}));
    setShowPaymentModal(false);
  }, []);

  // Process payment
  const handleProceedToPayment = useCallback(() => {
    // Validate address
    if (!address || !city || !state || !pincode) {
      Alert.alert('Incomplete Address', 'Please fill in all address fields.');
      return;
    }

    // Validate payment method
    if (!selectedPaymentMethod) {
      Alert.alert(
        'Payment Method Required',
        'Please select a payment method to continue.',
      );
      return;
    }

    // Validate payment details
    let isValid = false;
    let errorMessage = '';

    switch (selectedPaymentMethod) {
      case PAYMENT_METHODS.UPI:
        isValid = paymentDetails.upiId.includes('@');
        errorMessage = 'Please enter a valid UPI ID';
        break;
      case PAYMENT_METHODS.CARD:
        isValid =
          paymentDetails.cardNumber.length >= 16 &&
          paymentDetails.cardExpiry.length >= 5 &&
          paymentDetails.cardCVV.length >= 3;
        errorMessage =
          'Please enter valid card details (number, expiry and CVV)';
        break;
      case PAYMENT_METHODS.NETBANKING:
        isValid = !!paymentDetails.bankName;
        errorMessage = 'Please select a bank for net banking';
        break;
    }

    if (!isValid) {
      Alert.alert('Invalid Payment Details', errorMessage);
      return;
    }

    // If all validations pass, navigate to processing screen
    const fullAddress = `${address}, ${city}, ${state} - ${pincode}`;
    navigation.navigate('PaymentProcessingScreen', {
      paymentMethod: selectedPaymentMethod,
      subtotal: subtotal,
      discount: discount,
      amount: finalAmount,
      address: fullAddress,
      items: items,
      promoCode: promoCode,
    });
  }, [
    address,
    city,
    state,
    pincode,
    selectedPaymentMethod,
    paymentDetails,
    finalAmount,
    subtotal,
    discount,
    items,
    promoCode,
    navigation,
  ]);

  // Render payment modal content based on selected method
  const renderPaymentModalContent = () => {
    switch (selectedPaymentMethod) {
      case PAYMENT_METHODS.UPI:
        return (
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>Enter UPI ID</Text>
            <TextInput
              style={styles.paymentInput}
              placeholder="yourname@upi"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={paymentDetails.upiId}
              onChangeText={handleUpiInputChange}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.submitButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        );
      case PAYMENT_METHODS.CARD:
        return (
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>Enter Card Details</Text>
            <TextInput
              style={styles.paymentInput}
              placeholder="Card Number"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={paymentDetails.cardNumber}
              onChangeText={text => handleCardInputChange('cardNumber', text)}
              keyboardType="number-pad"
              maxLength={16}
            />
            <View style={styles.cardDetailRow}>
              <TextInput
                style={[styles.paymentInput, {flex: 1, marginRight: 10}]}
                placeholder="MM/YY"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={paymentDetails.cardExpiry}
                onChangeText={text => handleCardInputChange('cardExpiry', text)}
                maxLength={5}
              />
              <TextInput
                style={[styles.paymentInput, {flex: 1}]}
                placeholder="CVV"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={paymentDetails.cardCVV}
                onChangeText={text => handleCardInputChange('cardCVV', text)}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry={true}
              />
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.submitButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        );
      case PAYMENT_METHODS.NETBANKING:
        const banks = [
          'State Bank of India',
          'HDFC Bank',
          'ICICI Bank',
          'Axis Bank',
          'Kotak Mahindra Bank',
        ];
        return (
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>Select Bank</Text>
            <ScrollView style={styles.bankList}>
              {banks.map(bank => (
                <TouchableOpacity
                  key={bank}
                  style={styles.bankItem}
                  onPress={() => handleBankSelect(bank)}>
                  <Text style={styles.bankName}>{bank}</Text>
                  {paymentDetails.bankName === bank && (
                    <Image
                      source={icons.check}
                      style={styles.checkIcon}
                      tintColor="#34C759"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };

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
          <Text style={styles.headerTitle}>CHECKOUT</Text>
          <View style={styles.placeholderView} />
        </View>

        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          {/* Delivery Address Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Street Address"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.addressInput, {flex: 1, marginRight: 8}]}
                  placeholder="City"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={city}
                  onChangeText={setCity}
                />
                <TextInput
                  style={[styles.addressInput, {flex: 1}]}
                  placeholder="State"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={state}
                  onChangeText={setState}
                />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Pincode"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethodsContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === PAYMENT_METHODS.UPI &&
                    styles.selectedPaymentMethod,
                ]}
                onPress={() => handlePaymentMethodSelect(PAYMENT_METHODS.UPI)}>
                <Image
                  source={icons.upi}
                  style={styles.paymentIcon}
                  tintColor="#007AFF"
                />
                <Text style={styles.paymentMethodText}>UPI</Text>
                {paymentDetails.upiId && (
                  <Text style={styles.paymentDetailText}>
                    {paymentDetails.upiId}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === PAYMENT_METHODS.CARD &&
                    styles.selectedPaymentMethod,
                ]}
                onPress={() => handlePaymentMethodSelect(PAYMENT_METHODS.CARD)}>
                <Image
                  source={icons.card}
                  style={styles.paymentIcon}
                  tintColor="#FF9500"
                />
                <Text style={styles.paymentMethodText}>Card</Text>
                {paymentDetails.cardNumber && (
                  <Text style={styles.paymentDetailText}>
                    ●●●● ●●●● ●●●● {paymentDetails.cardNumber.slice(-4)}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === PAYMENT_METHODS.NETBANKING &&
                    styles.selectedPaymentMethod,
                ]}
                onPress={() =>
                  handlePaymentMethodSelect(PAYMENT_METHODS.NETBANKING)
                }>
                <Image
                  source={icons.netbanking}
                  style={styles.paymentIcon}
                  tintColor="#34C759"
                />
                <Text style={styles.paymentMethodText}>Net Banking</Text>
                {paymentDetails.bankName && (
                  <Text style={styles.paymentDetailText}>
                    {paymentDetails.bankName}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Summary Section */}
          <View style={styles.ordersummarysectionContainer}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.orderSummaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{items.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  ₹{subtotal?.toFixed(2) || '0.00'}
                </Text>
              </View>

              {/* Display discount if it exists */}
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>Discount</Text>
                  <Text style={styles.discountValue}>
                    -₹{discount.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Display promo code if it exists */}
              {promoCode && (
                <View style={styles.promoRow}>
                  <Text style={styles.promoLabel}>Promo Applied</Text>
                  <Text style={styles.promoValue}>{promoCode}</Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>₹0.00</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  ₹{finalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Proceed to Payment Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleProceedToPayment}
            activeOpacity={0.8}>
            <Text style={styles.payButtonText}>
              Pay ₹{finalAmount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPaymentModal}
          onRequestClose={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  {selectedPaymentMethod === PAYMENT_METHODS.UPI
                    ? 'UPI Payment'
                    : selectedPaymentMethod === PAYMENT_METHODS.CARD
                    ? 'Card Payment'
                    : 'Net Banking'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                  activeOpacity={0.7}>
                  <Image
                    source={icons.close}
                    style={styles.closeIcon}
                    tintColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
              {renderPaymentModalContent()}
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... Your existing styles

  // Add these new styles for discount and promo display
  discountLabel: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '500',
  },
  promoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  promoLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  promoValue: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Your existing styles...
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
  placeholderView: {
    width: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 30,
    paddingBottom: 10,
    zIndex: 1,
  },
  sectionContainer: {
    marginBottom: 14,
  },
  ordersummarysectionContainer: {
    marginBottom: 110,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  addressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 14,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addressInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  paymentMethodsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  paymentMethodCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  paymentIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  paymentDetailText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  orderSummaryContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2,
  },
  payButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.91,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 13, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  paymentModalContent: {
    padding: 16,
  },
  paymentModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  paymentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  cardDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bankList: {
    maxHeight: 200,
    marginBottom: 8,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bankName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  checkIcon: {
    width: 20,
    height: 20,
  },
});

export default PaymentScreen;
