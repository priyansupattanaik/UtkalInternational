import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';

const Splash = ({navigation}: any) => {
  // Animation values - memoized with useRef
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create animation once
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

    // Navigate after delay - using a single timeout
    const timer = setTimeout(() => {
      navigation.replace('LoginScreen');
    }, 2500);

    // Cleanup to prevent memory leaks
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView
          style={styles.blurContainer}
          blurType="dark"
          blurAmount={3}
          reducedTransparencyFallbackColor="black"
        />
      ) : (
        <View style={styles.androidBackground} />
      )}

      <Animated.Image
        source={require('../../assets/images/logoWhite.png')}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{scale: logoScale}],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

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
    width: 180,
    height: 180,
  },
});

export default Splash;
