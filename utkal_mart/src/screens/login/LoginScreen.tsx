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
  StatusBar,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import API_CONFIG from '../../components/config';
import {BlurView} from '@react-native-community/blur';
import {StackNavigationProp} from '@react-navigation/stack';

const {width, height} = Dimensions.get('window');

// Define navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<any, 'LoginScreen'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  // Refs for inputs and focus management
  const passwordInputRef = useRef<TextInput>(null);

  // State management
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get auth context
  const {login, loading, error} = useAuth();

  // Animation setup - run only once
  useEffect(() => {
    // Reset animation values to prevent unusual behavior on remount
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop(); // Cleanup animation
    };
  }, []);

  // Clear errors when inputs change
  useEffect(() => {
    if (errors.phone && phone) {
      setErrors(prev => ({...prev, phone: undefined}));
    }
  }, [phone, errors.phone]);

  useEffect(() => {
    if (errors.password && password) {
      setErrors(prev => ({...prev, password: undefined}));
    }
  }, [password, errors.password]);

  // Memoize form validation
  const validateForm = useCallback(() => {
    let formErrors: {phone?: string; password?: string} = {};
    let isValid = true;

    // Phone validation
    if (!phone.trim()) {
      formErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phone.trim())) {
      formErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    // Password validation
    if (!password) {
      formErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  }, [phone, password]);

  // Handle phone input submission - focus password
  const handlePhoneSubmit = useCallback(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  // Memoize login handler with error handling
  const handleLogin = useCallback(async () => {
    if (isSubmitting || loading) return;

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(phone.trim(), password, false);
      // No navigation call needed here - AppContainer will handle it automatically
      // when isAuthenticated becomes true
    } catch (err: any) {
      // Determine the error type for better user feedback
      if (
        err.message?.includes('Network Error') ||
        err.message?.includes('connect')
      ) {
        Alert.alert(
          'Connection Error',
          `Couldn't connect to the server. Please check your internet connection.`,
        );
      } else if (err.response?.status === 401) {
        Alert.alert(
          'Login Failed',
          'Invalid credentials. Please check your phone number and password.',
        );
      } else {
        Alert.alert(
          'Login Failed',
          err.message || 'An error occurred during login. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, password, login, validateForm, isSubmitting, loading]);

  // Handle password submission (login button press)
  const handlePasswordSubmit = useCallback(() => {
    handleLogin();
  }, [handleLogin]);

  // Memoize navigation handlers
  const handleSignUp = useCallback(() => {
    navigation.navigate('SignupScreen');
  }, [navigation]);

  const handleTermsAndConditions = useCallback(() => {
    navigation.navigate('TermsAndConditionsScreen');
  }, [navigation]);

  const handlePrivacyPolicy = useCallback(() => {
    navigation.navigate('PrivacyPolicyScreen');
  }, [navigation]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prevState => !prevState);
  }, []);

  // Memoize image sources to prevent rerenders
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
  const hideIcon = useMemo(
    () => require('../../assets/images/icons/hide.png'),
    [],
  );
  const unhideIcon = useMemo(
    () => require('../../assets/images/icons/unhide.png'),
    [],
  );

  // Memoize visibility toggle icons
  const visibilityIconSource = useMemo(
    () => (showPassword ? hideIcon : unhideIcon),
    [showPassword, hideIcon, unhideIcon],
  );

  // Animation style
  const animatedStyle = useMemo(
    () => ({
      opacity: fadeAnim,
      transform: [{translateY: slideAnim}],
    }),
    [fadeAnim, slideAnim],
  );

  // Determine the login button state
  const isLoginButtonDisabled = useMemo(
    () => loading || isSubmitting,
    [loading, isSubmitting],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={styles.keyboardAvoidView}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}>
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
              <Image source={logoSource} style={styles.logo} fadeDuration={0} />
            </View>

            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Utkal International</Text>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.phone && styles.inputWrapperError,
                ]}>
                <View style={styles.inputIcon}>
                  <Image
                    source={phoneIconSource}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={15}
                  returnKeyType="next"
                  onSubmitEditing={handlePhoneSubmit}
                  blurOnSubmit={false}
                  autoCapitalize="none"
                  editable={!isSubmitting && !loading}
                />
              </View>
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputWrapperError,
                ]}>
                <View style={styles.inputIcon}>
                  <Image
                    source={lockIconSource}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordSubmit}
                  autoCapitalize="none"
                  editable={!isSubmitting && !loading}
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={togglePasswordVisibility}
                  activeOpacity={0.7}
                  disabled={isSubmitting || loading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
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
              style={[
                styles.loginButton,
                isLoginButtonDisabled && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoginButtonDisabled}>
              {loading || isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={handleSignUp}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                disabled={isSubmitting || loading}>
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
                <Text style={styles.termsLink} onPress={handlePrivacyPolicy}>
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

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
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
    paddingHorizontal: width > 400 ? 40 : 32,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    maxWidth: 130,
    maxHeight: 130,
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
    marginBottom: 16,
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
  inputWrapperError: {
    borderColor: 'rgba(255, 69, 58, 0.8)', // Apple iOS red
  },
  inputIcon: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  iconImage: {
    width: 22,
    height: 22,
    tintColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '400',
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
    paddingVertical: 14,
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
  loginButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
    shadowOpacity: 0.15,
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
    marginTop: 16,
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
    marginBottom: 20,
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
