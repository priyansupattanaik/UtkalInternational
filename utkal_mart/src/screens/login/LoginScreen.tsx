import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import API_CONFIG from '../../components/config';
import {BlurView} from '@react-native-community/blur';

const {width, height} = Dimensions.get('window');

const LoginScreen = ({navigation}) => {
  // State management
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Memoize animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get auth context
  const {login, loading, error} = useAuth();

  // Animation setup - run only once
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600, // Slightly decreased for better performance
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600, // Slightly decreased for better performance
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop(); // Cleanup animation
    };
  }, []);

  // Memoize form validation
  const validateForm = useCallback(() => {
    let formErrors = {};
    let isValid = true;

    if (!phone.trim()) {
      formErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phone.trim())) {
      formErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    if (!password) {
      formErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  }, [phone, password]);

  // Memoize login handler
  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(phone.trim(), password, false);

      navigation.reset({
        index: 0,
        routes: [{name: 'TabNavigator'}],
      });
    } catch (err) {
      if (err.message?.includes('Network Error')) {
        Alert.alert(
          'Connection Error',
          `Couldn't connect to the server. Please check your internet connection.`,
        );
      } else {
        Alert.alert(
          'Login Failed',
          err.message ||
            'Invalid credentials. Please check your phone number and password.',
        );
      }
    }
  }, [phone, password, login, navigation, validateForm]);

  // Memoize navigation handlers
  const handleSignUp = useCallback(() => {
    navigation.navigate('SignupScreen');
  }, [navigation]);

  const handleTermsAndConditions = useCallback(() => {
    navigation.navigate('TermsAndConditionsScreen');
  }, [navigation]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prevState => !prevState);
  }, []);

  // Memoize background sources
  const backgroundSource = useMemo(
    () => require('../../assets/images/backgrounds/bg3.jpg'),
    [],
  );
  const logoSource = useMemo(
    () => require('../../assets/images/logoWhite.png'),
    [],
  );
  const phoneIconSource = useMemo(
    () => require('../../assets/images/icons/phone.png'),
    [],
  );
  const lockIconSource = useMemo(
    () => require('../../assets/images/icons/lock.png'),
    [],
  );

  // Memoize visibility toggle icons
  const visibilityIconSource = useMemo(
    () =>
      showPassword
        ? require('../../assets/images/icons/hide.png')
        : require('../../assets/images/icons/unhide.png'),
    [showPassword],
  );

  // Animation style
  const animatedStyle = useMemo(
    () => ({
      opacity: fadeAnim,
      transform: [{translateY: slideAnim}],
    }),
    [fadeAnim, slideAnim],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidView}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <ImageBackground
          style={styles.container}
          source={backgroundSource}
          resizeMode="cover">
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.blurOverlay}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
            />
          ) : (
            <View style={styles.androidBlurOverlay} />
          )}

          <Animated.View style={[styles.formContainer, animatedStyle]}>
            <View style={styles.logoContainer}>
              <Image source={logoSource} style={styles.logo} />
            </View>

            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Utkal International</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Image
                    source={phoneIconSource}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={15}
                />
              </View>
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Image
                    source={lockIconSource}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={togglePasswordVisibility}
                  activeOpacity={0.7}>
                  <Image
                    source={visibilityIconSource}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text
                  style={styles.termsLink}
                  onPress={handleTermsAndConditions}>
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={handleTermsAndConditions}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Animated.View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Extracted common styles
const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  androidBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  inputIcon: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '400',
  },
  inputError: {
    borderColor: 'rgba(255, 69, 58, 0.8)', // Apple iOS red
  },
  errorText: {
    color: 'rgba(255, 69, 58, 0.9)', // Apple iOS red
    fontSize: 13,
    marginTop: 6,
    marginLeft: 16,
    fontWeight: '500',
  },
  visibilityButton: {
    padding: 12,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityIcon: {
    width: 22,
    height: 22,
    tintColor: 'rgba(255, 255, 255, 0.8)',
  },
  loginButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Apple iOS blue with slight transparency
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
    shadowColor: 'rgba(0, 122, 255, 0.8)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
    // Glass effect with border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  noAccountText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '400',
  },
  signUpText: {
    color: 'rgba(10, 132, 255, 1)', // Apple iOS blue
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 50,
    marginBottom: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: 'rgba(10, 132, 255, 0.85)', // Apple iOS blue with transparency
    fontWeight: '500',
    textDecorationLine: 'none',
  },
});

export default LoginScreen;
