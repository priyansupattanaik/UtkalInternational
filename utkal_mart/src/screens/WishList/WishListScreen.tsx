import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useFavorite} from '../../utils/FavoriteContext';
import {BlurView} from '@react-native-community/blur';
import API_CONFIG from '../../components/config';

const WishListScreen = () => {
  const {favorites, toggleFavorite} = useFavorite();
  const navigation = useNavigation();

  // Memoize assets
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg1.png'),
    [],
  );
  const backIcon = useMemo(
    () => require('../../assets/images/pageicons/arrow.png'),
    [],
  );
  const heartIcon = useMemo(
    () => require('../../assets/images/tabicons/heart.png'),
    [],
  );
  const defaultProductImage = useMemo(
    () => require('../../assets/images/producticons/All.png'),
    [],
  );

  // Navigation handlers - memoized for performance
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const navigateToHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const navigateToProduct = useCallback(
    product => {
      navigation.navigate('ProductInfo', {product});
    },
    [navigation],
  );

  // Remove from wishlist handler - memoized
  const handleRemoveFromWishlist = useCallback(
    item => {
      toggleFavorite(item);
    },
    [toggleFavorite],
  );

  // Get correct image URL - memoized
  const getImageUrl = useCallback(imageUrl => {
    if (!imageUrl) return null;

    return imageUrl.startsWith('http')
      ? imageUrl
      : `${API_CONFIG.BASE_URL}${imageUrl}`;
  }, []);

  // Render wishlist item - memoized
  const renderWishlistItem = useCallback(
    ({item}) => {
      // Ensure image URL is properly formatted
      const imageUrl = getImageUrl(item.image);

      return (
        <TouchableOpacity
          style={styles.wishlistCard}
          onPress={() => navigateToProduct(item)}
          activeOpacity={0.8}>
          <View style={styles.productImageContainer}>
            <Image
              source={imageUrl ? {uri: imageUrl} : defaultProductImage}
              style={styles.productImage}
              defaultSource={defaultProductImage}
              // Add loading placeholder and error handling
              onError={() =>
                console.log(`Failed to load image for ${item.title}`)
              }
              fadeDuration={200}
            />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={styles.productTitle}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.title || 'Unnamed Product'}
            </Text>

            <Text
              style={styles.productDescription}
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.description || 'No description available'}
            </Text>

            <Text style={styles.priceText}>
              ₹
              {typeof item.price === 'number'
                ? item.price.toLocaleString()
                : item.price}
            </Text>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFromWishlist(item)}
              activeOpacity={0.7}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [
      navigateToProduct,
      handleRemoveFromWishlist,
      getImageUrl,
      defaultProductImage,
    ],
  );

  // Key extractor - memoized
  const keyExtractor = useCallback(
    item => item.id?.toString() || Math.random().toString(),
    [],
  );

  // Separator for FlatList - memoized
  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // Empty component - memoized
  const EmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Image
          source={heartIcon}
          style={styles.emptyIcon}
          tintColor="rgba(255, 255, 255, 0.3)"
        />
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={navigateToHome}
          activeOpacity={0.8}>
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    ),
    [heartIcon, navigateToHome],
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
            activeOpacity={0.7}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Image
              source={backIcon}
              style={styles.backIcon}
              tintColor="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>WISHLIST</Text>

          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <FlatList
            data={favorites}
            renderItem={renderWishlistItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.wishlistContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={EmptyComponent}
            keyboardShouldPersistTaps="handled"
          />
        </View>
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
  headerRightPlaceholder: {
    width: 32,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 30,
    paddingBottom: 20,
    zIndex: 1,
  },
  wishlistContainer: {
    paddingBottom: 100, // Increased to avoid tab bar overlap
    flexGrow: 1,
  },
  wishlistCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    lineHeight: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  removeButton: {
    backgroundColor: 'rgba(250, 12, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    minHeight: 300,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    opacity: 1,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  separator: {
    height: 12,
  },
});

export default WishListScreen;
