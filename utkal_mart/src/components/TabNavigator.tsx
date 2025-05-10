import * as React from 'react';
import {Image, View, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useMemo} from 'react';

// Screens
import Home from '../screens/Home/Home';
import WishListScreen from '../screens/WishList/WishListScreen';
import CartScreen from '../screens/Cart/CartScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProductInfo from '../screens/ProductInfo';

// Define tab icons with correct type
interface TabIcon {
  name: string;
  image: any; // Using 'any' for image require
}

// Custom icons for each tab - defined outside the component to prevent recreating on each render
const TAB_ICONS: TabIcon[] = [
  {name: 'Home', image: require('../assets/images/tabicons/home.png')},
  {name: 'Profile', image: require('../assets/images/tabicons/user.png')},
  {name: 'Cart', image: require('../assets/images/tabicons/cart.png')},
  {name: 'Wishlist', image: require('../assets/images/tabicons/heart.png')},
];

// Create Stack Navigator for each tab screen
const Stack = createStackNavigator();

// Stack navigator components defined as separate components for better organization
const HomeStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="HomeTab" component={Home} />
    <Stack.Screen name="ProductInfo" component={ProductInfo} />
  </Stack.Navigator>
);

const WishListStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="WishListScreen" component={WishListScreen} />
    <Stack.Screen name="ProductInfo" component={ProductInfo} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="CartScreen" component={CartScreen} />
    <Stack.Screen name="ProductInfo" component={ProductInfo} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
  </Stack.Navigator>
);

// Tab Navigator
const Tab = createBottomTabNavigator();

// Custom tab bar background
const TabBarBackground = () => (
  <View style={styles.tabBarBackground}>
    <View style={styles.blurEffect} />
  </View>
);

export default function TabNavigator() {
  // Use useMemo to prevent unnecessary recalculations of screen options
  const screenOptions = useMemo(() => {
    return ({route}) => ({
      tabBarIcon: ({focused}) => {
        const platform = TAB_ICONS.find(p => p.name === route.name);
        if (platform) {
          return (
            <Image
              source={platform.image}
              style={{
                width: 20,
                height: 20,
                tintColor: focused
                  ? 'rgba(0, 122, 255, 1)'
                  : 'rgba(255, 255, 255, 0.5)',
                opacity: focused ? 1 : 0.7,
              }}
              // Add these props for better performance
              resizeMode="contain"
              fadeDuration={0}
            />
          );
        }
        return null;
      },
      tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
      tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
      tabBarShowLabel: true,
      tabBarStyle: {
        backgroundColor: 'transparent',
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        height: Platform.OS === 'ios' ? 80 : 64,
        borderTopWidth: 0,
        marginHorizontal: 16,
        borderRadius: 30,
        position: 'absolute',
        bottom: 10,
        elevation: 0,
        shadowOpacity: 0,
        // For Android we need to add a background
        ...(Platform.OS === 'android' && {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }),
      },
      tabBarItemStyle: {
        // Add padding for two-line labels on smaller items
        paddingVertical: 4,
      },
      tabBarBackground: () => <TabBarBackground />,
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
      },
      headerShown: false,
    });
  }, []);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Wishlist" component={WishListStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 30,
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    overflow: 'hidden',
  },
});
