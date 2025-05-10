import React, {useEffect, useRef, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {StackNavigationProp} from '@react-navigation/stack';

// Define proper type for navigation prop
type SplashScreenNavigationProp = StackNavigationProp<any, 'Splash'>;

interface SplashProps {
  navigation: SplashScreenNavigationProp;
}

const Splash: React.FC<SplashProps> = ({navigation}) => {
  // Animation values - memoized with useRef
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Memoize the logo resource to prevent unnecessary reloading
  const logoImage = useMemo(
    () => require('../../assets/images/logoWhite.png'),
    [],
  );

  // Memoized animation styles for better performance
  const animatedStyles = useMemo(
    () => ({
      opacity: logoOpacity,
      transform: [{scale: logoScale}],
    }),
    [logoOpacity, logoScale],
  );

  useEffect(() => {
    // Ensure clean state and prevent overlapping animations
    logoScale.setValue(0.85);
    logoOpacity.setValue(0);

    // Create animation sequence with better timing
    const animation = Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Start animation immediately
    animation.start();

    // Use state to track if component is mounted
    let isMounted = true;

    // Navigate after delay - using a single timeout
    const timer = setTimeout(() => {
      // Only navigate if the component is still mounted
      if (isMounted) {
        navigation.replace('LoginScreen');
      }
    }, 2500);

    // Cleanup to prevent memory leaks
    return () => {
      isMounted = false;
      clearTimeout(timer);
      animation.stop();
    };
  }, [navigation]);

  // Background component based on platform
  const BackgroundComponent =
    Platform.OS === 'ios' ? (
      <BlurView
        style={styles.blurContainer}
        blurType="dark"
        blurAmount={3}
        reducedTransparencyFallbackColor="black"
      />
    ) : (
      <View style={styles.androidBackground} />
    );

  return (
    <View style={styles.container}>
      {/* Hide status bar during splash */}
      <StatusBar hidden />

      {/* Platform-specific background */}
      {BackgroundComponent}

      <Animated.Image
        source={logoImage}
        style={[styles.logo, animatedStyles]}
        resizeMode="contain"
        // Improve image loading performance
        fadeDuration={0}
      />
    </View>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  androidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  logo: {
    width: width * 0.45, // Responsive sizing based on screen width
    height: width * 0.45, // Keep aspect ratio
    maxWidth: 220, // Set maximum size
    maxHeight: 220,
  },
});

export default Splash;
