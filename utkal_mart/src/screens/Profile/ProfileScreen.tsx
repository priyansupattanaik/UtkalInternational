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
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useCart} from '../../context/CartContext';
import axios from 'axios';
import API_CONFIG from '../../components/config';
import {BlurView} from '@react-native-community/blur';

const {width} = Dimensions.get('window');

// Memoized icon paths for better performance
const icons = {
  phone: require('../../assets/images/tabicons/home.png'),
  email: require('../../assets/images/tabicons/home.png'),
  orders: require('../../assets/images/tabicons/cart.png'),
  edit: require('../../assets/images/icons/edit.png'),
  signout: require('../../assets/images/icons/logout.png'),
  truck: require('../../assets/images/pageicons/checkout.png'),
  calendar: require('../../assets/images/pageicons/arrow.png'),
  close: require('../../assets/images/icons/close.png'),
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, token, logout} = useAuth();
  const {cartItems} = useCart();

  // State management
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Helper function for random future date
  const getRandomFutureDate = useCallback(() => {
    const today = new Date();
    const daysToAdd = Math.floor(Math.random() * 5) + 3;
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysToAdd);
    return futureDate.toLocaleDateString();
  }, []);

  // Add a new order from cart - memoized to prevent recreation
  const addOrderFromCart = useCallback(
    items => {
      if (!items || items.length === 0) return;

      const newOrder = {
        id: 'ORD' + Math.floor(Math.random() * 10000000),
        date: new Date().toLocaleDateString(),
        status: 'Processing',
        deliveryDate: getRandomFutureDate(),
        items: [...items],
        total: items.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0,
        ),
      };

      setOrders(prevOrders => [newOrder, ...prevOrders]);
      setCurrentOrder(newOrder);
    },
    [getRandomFutureDate],
  );

  // Set initial profile data and fetch from API
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        address: '',
      });

      fetchProfileData();
    }
  }, [user]);

  // Check for checkout params
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const route = navigation
        .getState()
        .routes.find(r => r.name === 'Profile');

      if (
        route?.params?.checkedOutItems &&
        route.params.checkedOutItems.length > 0
      ) {
        addOrderFromCart(route.params.checkedOutItems);
        navigation.setParams({checkedOutItems: null});
      }
    });

    return unsubscribe;
  }, [navigation, addOrderFromCart]);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfileData(prevData => ({
        ...prevData,
        ...response.data,
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler - fixed to avoid navigation reset error
  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          // No navigation code needed here
          // AuthProvider will handle the state change and
          // AppContainer will automatically render AuthNavigator
        },
      },
    ]);
  }, [logout]);

  // View orders handler - memoized
  const handleViewOrders = useCallback(() => {
    if (orders.length > 0) {
      setCurrentOrder(orders[0]);
      setShowOrderModal(true);
    } else {
      Alert.alert(
        'No Orders Yet',
        'You have not placed any orders yet. Start shopping and check out from your cart to see orders here.',
        [{text: 'OK'}],
      );
    }
  }, [orders]);

  // Close modal handler - memoized
  const handleCloseModal = useCallback(() => {
    setShowOrderModal(false);
  }, []);

  // Navigate to edit profile - memoized
  const navigateToEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  // Get first letter of name for avatar
  const avatarLetter = useMemo(() => {
    return profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U';
  }, [profileData.name]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ImageBackground
        source={require('../../assets/images/backgrounds/bg1.png')}
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

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{avatarLetter}</Text>
                </View>
                <Text style={styles.userName}>{profileData.name}</Text>
              </View>

              {/* Profile Info Fields */}
              <View style={styles.infoContainer}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Phone</Text>
                  <View style={styles.inputContainer}>
                    <Image
                      source={icons.phone}
                      style={styles.fieldIcon}
                      tintColor="rgba(255, 255, 255, 0.6)"
                    />
                    <Text style={styles.fieldValue}>{profileData.phone}</Text>
                  </View>
                </View>

                {profileData.email && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputContainer}>
                      <Image
                        source={icons.email}
                        style={styles.fieldIcon}
                        tintColor="rgba(255, 255, 255, 0.6)"
                      />
                      <Text style={styles.fieldValue}>{profileData.email}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.ordersButton]}
                onPress={handleViewOrders}
                activeOpacity={0.8}>
                <Image
                  source={icons.orders}
                  style={styles.buttonIcon}
                  tintColor="#FFFFFF"
                />
                <Text style={styles.buttonText}>My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={navigateToEditProfile}
                activeOpacity={0.8}>
                <Image
                  source={icons.edit}
                  style={styles.buttonIcon}
                  tintColor="#FFFFFF"
                />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.8}>
                <Image
                  source={icons.signout}
                  style={styles.buttonIcon}
                  tintColor="#FFFFFF"
                />
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order History Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showOrderModal}
          onRequestClose={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.orderModalContainer}>
              {/* Modal Header */}
              <View style={styles.orderModalHeader}>
                <Text style={styles.orderModalTitle}>My Orders</Text>
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

              {/* Order Details */}
              <ScrollView
                style={styles.orderModalContent}
                showsVerticalScrollIndicator={false}>
                {currentOrder ? (
                  <View style={styles.orderCard}>
                    {/* Order Header */}
                    <View style={styles.orderCardHeader}>
                      <View>
                        <Text style={styles.orderIdText}>
                          Order #{currentOrder.id}
                        </Text>
                        <Text style={styles.orderDateText}>
                          Placed on {currentOrder.date}
                        </Text>
                      </View>
                      <View style={styles.orderStatusBadge}>
                        <Text style={styles.orderStatusText}>
                          {currentOrder.status}
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
                        <Text style={styles.deliveryDateText}>
                          {currentOrder.deliveryDate}
                        </Text>
                      </View>
                    </View>

                    {/* Order Items */}
                    <View style={styles.orderItemsContainer}>
                      <Text style={styles.orderItemsTitle}>
                        Items ({currentOrder.items.length})
                      </Text>

                      {currentOrder.items.map(item => (
                        <View key={item.id} style={styles.orderItemCard}>
                          <View style={styles.orderItemImageContainer}>
                            <Image
                              source={
                                item.Product?.image
                                  ? {
                                      uri: item.Product.image.startsWith('http')
                                        ? item.Product.image
                                        : `${API_CONFIG.BASE_URL}${item.Product.image}`,
                                    }
                                  : require('../../assets/images/producticons/All.png')
                              }
                              style={styles.orderItemImage}
                              defaultSource={require('../../assets/images/producticons/All.png')}
                            />
                          </View>
                          <View style={styles.orderItemInfo}>
                            <Text
                              style={styles.orderItemName}
                              numberOfLines={1}>
                              {item.Product?.title || 'Product'}
                            </Text>
                            <Text style={styles.orderItemSeller}>
                              Seller: {item.Product?.sellerName || 'Unknown'}
                            </Text>
                            <View style={styles.orderItemPriceRow}>
                              <Text style={styles.orderItemPrice}>
                                ₹{item.price} × {item.quantity}
                              </Text>
                              <Text style={styles.orderItemTotal}>
                                ₹{parseFloat(item.price) * item.quantity}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}

                      {/* Order Total */}
                      <View style={styles.orderTotalContainer}>
                        <Text style={styles.orderTotalLabel}>Total Amount</Text>
                        <Text style={styles.orderTotalAmount}>
                          ₹{currentOrder.total.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noOrdersContainer}>
                    <Image
                      source={icons.orders}
                      style={styles.noOrdersIcon}
                      tintColor="rgba(255, 255, 255, 0.3)"
                    />
                    <Text style={styles.noOrdersText}>
                      No orders to display
                    </Text>
                  </View>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 30,
    paddingBottom: 20,
    zIndex: 1,
  },
  profileCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoContainer: {
    padding: 12,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fieldIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    opacity: 0.5,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 90,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  ordersButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.5)',
  },
  editButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 45, 85, 0.5)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderModalContainer: {
    width: width * 1,
    maxHeight: '80%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  orderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  orderModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  orderModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderDateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
  },
  deliveryInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  deliveryInfoText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deliveryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28,
  },
  calendarIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    opacity: 0.7,
  },
  deliveryDateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  orderItemsContainer: {
    marginTop: 8,
  },
  orderItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  orderItemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderItemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  orderItemSeller: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
  },
  orderItemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  orderTotalContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  noOrdersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noOrdersIcon: {
    width: 60,
    height: 60,
    opacity: 0.3,
    marginBottom: 16,
  },
  noOrdersText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default ProfileScreen;
