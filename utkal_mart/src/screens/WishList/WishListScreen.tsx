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

const WishlistScreen = () => {
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

  // Render wishlist item - memoized
  const renderWishlistItem = useCallback(
    ({item}) => {
      // Ensure image URL is properly formatted
      const imageUrl = item.image.startsWith('http')
        ? item.image
        : `http://10.8.219.31:5000${item.image}`;

      return (
        <TouchableOpacity
          style={styles.wishlistCard}
          onPress={() => navigateToProduct(item)}
          activeOpacity={0.8}>
          <View style={styles.productImageContainer}>
            <Image
              source={{uri: imageUrl}}
              style={styles.productImage}
              defaultSource={require('../../assets/images/producticons/All.png')}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.title}
            </Text>

            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>

            <Text style={styles.priceText}>₹{item.price}</Text>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFromWishlist(item)}
              activeOpacity={0.7}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [navigateToProduct, handleRemoveFromWishlist],
  );

  // Separator for FlatList - memoized
  const ItemSeparator = useCallback(() => <View style={{height: 12}} />, []);

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
              source={backIcon}
              style={styles.backIcon}
              tintColor="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>WISHLIST</Text>

          <View style={{width: 40}} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {favorites.length > 0 ? (
            <FlatList
              data={favorites}
              renderItem={renderWishlistItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.wishlistContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={ItemSeparator}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={5}
            />
          ) : (
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
          )}
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 1,
  },
  wishlistContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  wishlistCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(40, 40, 40, 0.75)',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  productImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
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
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    padding: 30,
    margin: 16,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    opacity: 0.7,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WishlistScreen;
