import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';

// Screens
import Splash from './src/screens/Splash/SplashScreen';
import LoginScreen from './src/screens/login/LoginScreen';
import SignupScreen from './src/screens/Signup/SignupScreen';
import TabNavigator from './src/components/TabNavigator';
import Home from './src/screens/Home/Home';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import EditProfileScreen from './src/screens/Profile/EditProfileScreen';
import WishListScreen from './src/screens/WishList/WishListScreen';
import CartScreen from './src/screens/Cart/CartScreen';
import ProductInfo from './src/screens/ProductInfo';
import CategoryScreen from './src/screens/CategoryScreen';
import PaymentScreen from './src/screens/Payment/PaymentScreen';
import OrderScreen from './src/screens/Order/OrderScreen';

// Context Providers
import {ThemeProvider} from './src/utils/ThemeContext';
import {FavoriteProvider} from './src/utils/FavoriteContext';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {CartProvider} from './src/context/CartContext'; // Import the new CartProvider

// Create the Stack Navigator
const Stack = createStackNavigator();

// AuthNavigator - handles auth-related screens
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// AppNavigator - handles app screens when user is authenticated
function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="OrderScreen" component={OrderScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="WishListScreen" component={WishListScreen} />
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="ProductInfo" component={ProductInfo} />
      <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
    </Stack.Navigator>
  );
}

// Main navigation container that switches between auth and app stacks
function AppContainer() {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4654" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Root component that wraps everything with providers
function App(): React.JSX.Element {
  useEffect(() => {
    SplashScreen.hide(); // Hide the splash screen when the app loads
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        {' '}
        {/* Add the CartProvider here, after AuthProvider but before others */}
        <FavoriteProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <AppContainer />
            </SafeAreaProvider>
          </ThemeProvider>
        </FavoriteProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default App;
