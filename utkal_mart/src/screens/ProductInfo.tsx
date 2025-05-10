import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useFavorite} from '../utils/FavoriteContext';
import {useAuth} from '../context/AuthContext';
import {useCart} from '../context/CartContext';
import {BlurView} from '@react-native-community/blur';
import API_CONFIG from '../components/config';

const {width, height} = Dimensions.get('window');

export default function ProductInfo() {
  // Hooks
  const route = useRoute();
  const navigation = useNavigation();
  const {product} = route.params;
  const {favorites, toggleFavorite} = useFavorite();
  const {token} = useAuth();
  const {addToCart, processingItemId} = useCart();

  // Memoized values
  const isFavorite = useMemo(
    () => favorites.some(fav => fav.id === product.id),
    [favorites, product.id],
  );
  const isAddingToCart = processingItemId === product?.id;

  // Assets
  const backIcon = useMemo(
    () => require('../assets/images/pageicons/arrow.png'),
    [],
  );
  const cartIcon = useMemo(
    () => require('../assets/images/tabicons/cart.png'),
    [],
  );
  const heartIcon = useMemo(
    () => require('../assets/images/tabicons/heart.png'),
    [],
  );
  const backgroundImage = useMemo(
    () => require('../assets/images/backgrounds/bg1.png'),
    [],
  );

  // Format image URL correctly
  const productImage = useMemo(() => {
    if (!product.image) return null;
    return product.image.startsWith('http')
      ? product.image
      : `${API_CONFIG.BASE_URL}${product.image}`;
  }, [product.image]);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideUpAnim = React.useRef(new Animated.Value(30)).current;

  // Setup animations
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop(); // Clean up animation on unmount
    };
  }, []);

  // Handle add to cart with CartContext
  const handleAddToCart = useCallback(async () => {
    const success = await addToCart(product.id);

    if (success) {
      Alert.alert('Success', 'Item added to cart successfully', [
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart'),
        },
        {
          text: 'Continue Shopping',
          style: 'cancel',
        },
      ]);
    }
  }, [addToCart, product.id, navigation]);

  // Memoized animated styles
  const animatedStyle = useMemo(
    () => ({
      opacity: fadeAnim,
      transform: [{translateY: slideUpAnim}],
    }),
    [fadeAnim, slideUpAnim],
  );

  // Navigation handler
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const navigateToCart = useCallback(
    () => navigation.navigate('Cart'),
    [navigation],
  );

  // Handle wishlist toggle with feedback
  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(product);
  }, [toggleFavorite, product]);

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
            style={styles.iconButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Image source={backIcon} style={styles.icon} tintColor="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text
              style={styles.headerText}
              numberOfLines={1}
              ellipsizeMode="tail">
              PRODUCT DETAILS
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={navigateToCart}
            activeOpacity={0.7}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Image source={cartIcon} style={styles.icon} tintColor="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Product Image */}
          <Animated.View style={[styles.imageCard, animatedStyle]}>
            <Image
              source={
                productImage
                  ? {uri: productImage}
                  : require('../assets/images/producticons/All.png')
              }
              style={styles.mainImage}
              resizeMode="contain"
              defaultSource={require('../assets/images/producticons/All.png')}
              fadeDuration={300}
            />
          </Animated.View>

          {/* Scrollable Product Details */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never">
            <Animated.View style={[styles.detailsCard, animatedStyle]}>
              {/* Title and Seller */}
              <View style={styles.titleContainer}>
                <Text
                  style={styles.title}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {product.title || 'Untitled Product'}
                </Text>
                <View style={styles.sellerContainer}>
                  <Text style={styles.sellerLabel}>Seller:</Text>
                  <Text
                    style={styles.sellerName}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {product.sellerName || 'Unknown'}
                  </Text>
                </View>
              </View>

              {/* Price and Action Buttons */}
              <View style={styles.priceContainer}>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>Price</Text>
                    <Text style={styles.price}>
                      ₹
                      {typeof product.price === 'number'
                        ? product.price.toLocaleString()
                        : product.price}
                    </Text>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.wishlistButtonSmall,
                        isFavorite && styles.wishlistButtonSmallActive,
                      ]}
                      onPress={handleToggleFavorite}
                      activeOpacity={0.8}
                      hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
                      <Image
                        source={heartIcon}
                        style={styles.buttonIcon}
                        tintColor="#FFFFFF"
                      />
                      <Text style={styles.wishlistButtonSmallText}>
                        {isFavorite ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addToCartButtonSmall}
                      onPress={handleAddToCart}
                      disabled={isAddingToCart}
                      activeOpacity={0.8}
                      hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
                      {isAddingToCart ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Image
                            source={cartIcon}
                            style={styles.buttonIcon}
                            tintColor="#FFFFFF"
                          />
                          <Text style={styles.addToCartButtonSmallText}>
                            Cart
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.description}>
                  {product.description || 'No description available.'}
                </Text>
              </View>

              {/* Add extra padding at the bottom for better scrolling */}
              <View style={styles.bottomPadding} />
            </Animated.View>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
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
    paddingVertical: 12,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  imageCard: {
    height: height * 0.38,
    padding: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  detailsCard: {
    flex: 1,
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    overflow: 'hidden',
    padding: 16,
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sellerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  priceContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    marginLeft: 8,
  },
  wishlistButtonSmallActive: {
    backgroundColor: 'rgba(255, 45, 85, 0.9)',
    borderColor: 'rgba(255, 45, 85, 0.9)',
  },
  addToCartButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  buttonIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  wishlistButtonSmallText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  addToCartButtonSmallText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  descriptionContainer: {
    flex: 1,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomPadding: {
    height: 80, // Extra padding at the bottom for better scrolling
  },
});
