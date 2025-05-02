import * as React from 'react';
import {Image, View, StyleSheet, Platform, BlurView} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Home from '../screens/Home/Home';
import WishListScreen from '../screens/WishList/WishListScreen';
import CartScreen from '../screens/Cart/CartScreen'; // Make sure this file exists
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CategoryScreen from '../screens/CategoryScreen';
import ProductInfo from '../screens/ProductInfo';

// Custom icons for each tab - we'll keep the same icons
const platforms = [
  {name: 'Home', image: require('../assets/images/tabicons/home.png')},
  {name: 'Profile', image: require('../assets/images/tabicons/user.png')},
  {name: 'Cart', image: require('../assets/images/tabicons/cart.png')},
  {name: 'Wishlist', image: require('../assets/images/tabicons/heart.png')},
];

// Create Stack Navigator for each tab screen
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeTab" component={Home} />
      <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
      <Stack.Screen name="ProductInfo" component={ProductInfo} />
    </Stack.Navigator>
  );
}

function WishListStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="WishListScreen" component={WishListScreen} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="CartScreen" component={CartScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Tab Navigator
const Tab = createBottomTabNavigator();

// Custom tab bar background with blur effect
const TabBarBackground = () => {
  // For iOS, we can use BlurView directly (if installed)
  // For Android, we simulate the glass effect with a semi-transparent background
  return (
    <View style={styles.tabBarBackground}>
      {/* On iOS we would use BlurView from react-native-blur here */}
      <View style={styles.blurEffect} />
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => {
          const platform = platforms.find(p => p.name === route.name);
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
          bottom: 20,
          elevation: 0,
          shadowOpacity: 0,
          // For Android we need to add a background
          ...(Platform.OS === 'android' && {
            backgroundColor: 'rgba(30, 30, 30, 0.7)',
          }),
        },
        tabBarItemStyle: {
          // Add padding for two-line labels on smaller items
          paddingVertical: 5,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          paddingBottom: Platform.OS === 'ios' ? 5 : 2,
        },
        headerShown: false,
      })}>
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
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'transparent',
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
    // Apply shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
});
