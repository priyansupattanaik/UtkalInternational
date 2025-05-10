import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Animated,
  Platform,
  BlurView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useCart} from '../../context/CartContext';
import API_CONFIG from '../../components/config';

// Default categories
const defaultCategories = [
  {
    id: '1',
    name: 'All',
    image: require('../../assets/images/producticons/All.png'),
  },
  {
    id: '2',
    name: 'Turmeric',
    image: require('../../assets/images/producticons/turmeric.png'),
  },
  {
    id: '3',
    name: 'Black Pepper',
    image: require('../../assets/images/producticons/Blackpepper.png'),
  },
  {
    id: '4',
    name: 'Corn',
    image: require('../../assets/images/producticons/corn.png'),
  },
  {
    id: '5',
    name: 'Coffee',
    image: require('../../assets/images/producticons/coffee.png'),
  },
  {
    id: '6',
    name: 'Red chilli',
    image: require('../../assets/images/producticons/Redchilli.png'),
  },
];

// Icon mapping
const categoryIconMapping = {
  All: require('../../assets/images/producticons/All.png'),
  Turmeric: require('../../assets/images/producticons/turmeric.png'),
  BlackPepper: require('../../assets/images/producticons/Blackpepper.png'),
  Corn: require('../../assets/images/producticons/corn.png'),
  Coffee: require('../../assets/images/producticons/coffee.png'),
  RedChilli: require('../../assets/images/producticons/Redchilli.png'),
  default: require('../../assets/images/producticons/All.png'),
};

// Banner images
const bannerImages = [
  {id: '1', image: require('../../assets/images/Banner/1.png')},
  {id: '2', image: require('../../assets/images/Banner/2.png')},
  {id: '3', image: require('../../assets/images/Banner/3.png')},
  {id: '4', image: require('../../assets/images/Banner/4.png')},
  {id: '5', image: require('../../assets/images/Banner/5.png')},
];

// Icons
const icons = {
  search: require('../../assets/images/icons/search.png'),
  close: require('../../assets/images/icons/close.png'),
  cart: require('../../assets/images/tabicons/cart.png'),
  alert: require('../../assets/images/icons/alert.png'),
};

const {width, height} = Dimensions.get('window');

interface HomeProps {
  route: any;
}

const Home: React.FC<HomeProps> = ({route}) => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const {addToCart, processingItemId, itemCount} = useCart();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Refs
  const bannerRef = useRef<FlatList>(null);

  // Animation values
  const carouselOpacity = useRef(new Animated.Value(1)).current;
  const categoryOpacity = useRef(new Animated.Value(1)).current;
  const searchBarWidth = useRef(new Animated.Value(width - 32)).current;

  // User name
  const userName = user?.name || route?.params?.userName || 'Guest';

  // API endpoints
  const productsEndpoint = `${API_CONFIG.BASE_URL}/api/products`;
  const categoriesEndpoint = `${API_CONFIG.BASE_URL}/api/products/categories`;

  // Get category icon
  const getCategoryIcon = useCallback((categoryItem: any) => {
    if (categoryItem.icon) {
      return {uri: `${API_CONFIG.BASE_URL}${categoryItem.icon}`};
    }

    if (categoryItem.name === 'All') {
      return categoryIconMapping.All;
    }

    return (
      categoryIconMapping[
        categoryItem.name as keyof typeof categoryIconMapping
      ] || categoryIconMapping.default
    );
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch(categoriesEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Format categories
      const formattedCategories = [
        {
          id: '0',
          name: 'All',
          image: categoryIconMapping['All'],
        },
        ...data.map((category: any, index: number) => {
          if (typeof category === 'string') {
            return {
              id: (index + 1).toString(),
              name: category,
              image: getCategoryIcon({name: category}),
            };
          }

          return {
            id: category.id?.toString() || (index + 1).toString(),
            name: category.name,
            image: getCategoryIcon(category),
          };
        }),
      ];

      setCategories(formattedCategories);
    } catch (error) {
      console.error(
        'Error fetching categories:',
        error instanceof Error ? error.message : String(error),
      );
      setCategories(defaultCategories);
    } finally {
      setLoadingCategories(false);
    }
  }, [categoriesEndpoint, getCategoryIcon]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await fetch(productsEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();
      const productsData = data.products || data;

      const updatedData = productsData.map((product: any) => ({
        ...product,
        image: product.image.startsWith('http')
          ? product.image
          : `${API_CONFIG.BASE_URL}${product.image}`,
      }));

      setProducts(updatedData);
    } catch (error) {
      console.error(
        'Error fetching products:',
        error instanceof Error ? error.message : String(error),
      );
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setLoadingProducts(false);
      setRefreshing(false);
    }
  }, [productsEndpoint]);

  // Add to cart
  const handleAddToCart = useCallback(
    async (productId: string) => {
      await addToCart(productId);
    },
    [addToCart],
  );

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(
      item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === 'All' || item.category === selectedCategory),
    );
  }, [products, searchTerm, selectedCategory]);

  // Search handlers
  const handleSearchFocus = useCallback(() => {
    setIsSearchActive(true);
    Animated.parallel([
      Animated.timing(carouselOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(categoryOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(searchBarWidth, {
        toValue: width - 32,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [carouselOpacity, categoryOpacity, searchBarWidth, width]);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setIsSearchActive(false);
    Animated.parallel([
      Animated.timing(carouselOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(categoryOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(searchBarWidth, {
        toValue: width - 32,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [carouselOpacity, categoryOpacity, searchBarWidth, width]);

  // Auto-scroll banner
  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (bannerRef.current && bannerImages.length > 0) {
        const nextIndex = (currentBannerIndex + 1) % bannerImages.length;
        bannerRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentBannerIndex(nextIndex);
      }
    }, 4000); // Slightly slower for more elegant experience

    return () => clearInterval(scrollInterval);
  }, [currentBannerIndex]);

  // Navigation handler
  const navigateToProduct = useCallback(
    (product: any) => {
      navigation.navigate('ProductInfo', {product});
    },
    [navigation],
  );

  const navigateToCart = useCallback(() => {
    navigation.navigate('Cart');
  }, [navigation]);

  // Memoized renderItem functions
  const renderProductCard = useCallback(
    ({item}: {item: any}) => (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigateToProduct(item)}
        activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: item.image}}
            style={styles.productImage}
            defaultSource={require('../../assets/images/producticons/All.png')}
          />

          {item.sellerName && (
            <View style={styles.sellerBadgeContainer}>
              <View style={styles.sellerBadgeBlur} />
              <Text style={styles.sellerText}>{item.sellerName}</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.price}</Text>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={e => {
                e.stopPropagation();
                handleAddToCart(item.id);
              }}
              activeOpacity={0.7}
              disabled={processingItemId === item.id}>
              {processingItemId === item.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>+</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleAddToCart, navigateToProduct, processingItemId],
  );

  const renderBanner = useCallback(
    ({item}: {item: any}) => (
      <View style={styles.bannerContainer}>
        <Image source={item.image} style={styles.bannerImage} />
      </View>
    ),
    [],
  );

  const renderCategoryItem = useCallback(
    ({item}: {item: any}) => (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.categoryItem,
          selectedCategory === item.name && styles.selectedCategoryItem,
        ]}
        onPress={() => setSelectedCategory(item.name)}
        activeOpacity={0.8}>
        <Image
          source={item.image}
          style={styles.categoryImage}
          tintColor={selectedCategory === item.name ? 'white' : '#007AFF'}
        />
        <Text
          style={[
            styles.categoryText,
            selectedCategory === item.name && styles.selectedCategoryText,
          ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    ),
    [selectedCategory],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ImageBackground
        source={require('../../assets/images/backgrounds/bg1.png')}
        style={styles.container}
        resizeMode="cover">
        {/* Backdrop blur overlay */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={styles.overlayBackground}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.5)"
          />
        ) : (
          <View style={styles.overlayBackgroundAndroid} />
        )}

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.greeting}>Hello, {userName}</Text>
            <Text style={styles.subGreeting}>
              Sourcing best organic products!
            </Text>
          </View>

          {/* Cart Icon Button with Badge */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={navigateToCart}
            activeOpacity={0.8}>
            <Image
              source={icons.cart}
              style={styles.iconImage}
              tintColor="#FFFFFF"
            />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {itemCount > 99 ? '99+' : itemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar - Animated width for Apple-like focus effect */}
        <Animated.View
          style={[styles.searchContainerWrapper, {width: searchBarWidth}]}>
          <View style={styles.searchContainer}>
            <Image
              source={icons.search}
              style={styles.searchIcon}
              tintColor="rgba(255, 255, 255, 0.6)"
            />
            <TextInput
              placeholder="Search products..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={handleSearchFocus}
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={handleSearchClear}
                style={styles.clearButton}>
                <View style={styles.clearIconContainer}>
                  <Image
                    source={icons.close}
                    style={styles.closeIcon}
                    tintColor="rgba(255, 255, 255, 0.9)"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Main Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }>
          {/* Banner Carousel - Hidden during search */}
          {!isSearchActive && (
            <Animated.View
              style={[styles.sectionWrapper, {opacity: carouselOpacity}]}>
              <View style={styles.bannerSection}>
                <FlatList
                  ref={bannerRef}
                  data={bannerImages}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderBanner}
                  keyExtractor={item => item.id}
                  onMomentumScrollEnd={event => {
                    const slideIndex = Math.floor(
                      event.nativeEvent.contentOffset.x /
                        event.nativeEvent.layoutMeasurement.width,
                    );
                    setCurrentBannerIndex(slideIndex);
                  }}
                />

                {/* Banner Pagination Dots */}
                <View style={styles.paginationContainer}>
                  {bannerImages.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentBannerIndex &&
                          styles.activePaginationDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Categories Section - Hidden during search */}
          {!isSearchActive && (
            <Animated.View
              style={[styles.sectionWrapper, {opacity: categoryOpacity}]}>
              <View style={styles.sectionContainerCategories}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                </View>

                {loadingCategories ? (
                  <ActivityIndicator
                    size="small"
                    color="#007AFF"
                    style={styles.categoryLoader}
                  />
                ) : (
                  <FlatList
                    data={categories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    style={styles.categoryList}
                    contentContainerStyle={styles.categoryListContent}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* Products Section - Always visible */}
          <View style={styles.sectionContainerProducts}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isSearchActive
                  ? 'Search Results'
                  : selectedCategory === 'All'
                  ? 'Featured Products'
                  : selectedCategory}
              </Text>
            </View>

            {/* Products Grid */}
            {loadingProducts ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={styles.loader}
              />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Image
                  source={icons.alert}
                  style={styles.alertIcon}
                  tintColor="#007AFF"
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchProducts}
                  activeOpacity={0.8}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Image
                  source={icons.search}
                  style={styles.noResultsIcon}
                  tintColor="#8E8E93"
                />
                <Text style={styles.noResultsText}>No products found</Text>
                {searchTerm && (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={handleSearchClear}
                    activeOpacity={0.8}>
                    <Text style={styles.clearButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderProductCard}
                keyExtractor={item => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.productRow}
                scrollEnabled={false}
                contentContainerStyle={styles.productsContainer}
              />
            )}
          </View>
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  // overlayBackground: {
  //   ...StyleSheet.absoluteFillObject,
  //   backgroundColor: 'rgba(0, 0, 0, 0.4)',
  // },
  overlayBackgroundAndroid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
    zIndex: 1,
  },
  userInfoContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.3,
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(171, 203, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30', // Apple red
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainerWrapper: {
    alignSelf: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  clearIconContainer: {
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  clearButton: {
    padding: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#fff',
    padding: 0,
    fontWeight: '400',
  },
  scrollContent: {
    paddingBottom: 0,
  },
  sectionWrapper: {
    marginBottom: 10,
  },
  bannerSection: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 180, // Taller for more impact
  },
  bannerContainer: {
    width: width - 32, // Account for padding
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activePaginationDot: {
    backgroundColor: '#007AFF', // Apple blue
    width: 20, // Longer indicator for selected item
    borderRadius: 4,
  },
  sectionContainerCategories: {
    marginBottom: 0,
    borderRadius: 12,
    padding: 2,
  },
  sectionContainerProducts: {
    marginBottom: 80,
    borderRadius: 12,
    padding: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  categoryList: {
    marginBottom: 0,
  },
  categoryListContent: {
    paddingRight: 0,
    paddingLeft: 0,
  },
  categoryLoader: {
    marginVertical: 20,
  },
  categoryItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Apple blue
    borderColor: 'rgba(0, 122, 255, 0.8)',
  },
  categoryImage: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
  },
  categoryText: {
    fontSize: 14,
    color: 'white', // Apple blue
    fontWeight: '900',
  },
  selectedCategoryText: {
    fontWeight: '600',
    color: '#fff',
  },
  productsContainer: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    width: (width - 60) / 2, // Account for padding and margin
    overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.1)',
    // // shadowColor: '#000',
    // // shadowOffset: {width: 0, height: 8},
    // // shadowOpacity: 0.2,
    // // shadowRadius: 15,
    // // elevation: 6,
  },
  imageContainer: {
    width: '100%',
    height: 150, // Slightly taller
    padding: 0,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',

    // borderTopLeftRadius: 16,
    // borderTopRightRadius: 16,
  },
  sellerBadgeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerBadgeBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sellerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    zIndex: 1,
  },
  productInfo: {
    padding: 12,
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
    letterSpacing: 0.3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF', // Apple blue
  },
  addToCartButton: {
    width: 24,
    height: 24,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Apple blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  loader: {
    marginTop: 40,
    marginBottom: 40,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    padding: 20,
  },
  alertIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF', // Apple blue
    fontSize: 17,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Apple blue
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    padding: 20,
  },
  noResultsIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  noResultsText: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 17,
    lineHeight: 22,
  },
  clearSearchButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Apple blue
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default Home;
