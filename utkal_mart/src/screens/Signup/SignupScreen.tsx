import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Animated,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {BlurView} from '@react-native-community/blur';
import {StackNavigationProp} from '@react-navigation/stack';

const {width, height} = Dimensions.get('window');

// Define navigation prop type
type SignupScreenNavigationProp = StackNavigationProp<any, 'SignupScreen'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

// Define error state type
interface FormErrors {
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({navigation}) => {
  // Input refs for focus management
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // State management
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Auth context
  const {register, loading, error} = useAuth();

  // Memoize image sources
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg3.jpg'),
    [],
  );
  const userIcon = useMemo(
    () => require('../../assets/images/icons/user.png'),
    [],
  );
  const phoneIcon = useMemo(
    () => require('../../assets/images/icons/phone.png'),
    [],
  );
  const lockIcon = useMemo(
    () => require('../../assets/images/icons/password.png'),
    [],
  );
  const showPasswordIcon = useMemo(
    () => require('../../assets/images/icons/unhide.png'),
    [],
  );
  const hidePasswordIcon = useMemo(
    () => require('../../assets/images/icons/hide.png'),
    [],
  );

  // Clear errors when inputs change
  useEffect(() => {
    if (errors.name && name) {
      setErrors(prev => ({...prev, name: undefined}));
    }
  }, [name, errors.name]);

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

  useEffect(() => {
    if (errors.confirmPassword && confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: undefined}));
    }
  }, [confirmPassword, errors.confirmPassword]);

  // Animation setup
  useEffect(() => {
    // Reset animation values to prevent issues on remount
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

    // Cleanup
    return () => {
      animation.stop();
    };
  }, [fadeAnim, slideAnim]);

  // Form validation
  const validateForm = useCallback(() => {
    const formErrors: FormErrors = {};
    let isValid = true;

    // Name validation
    if (!name.trim()) {
      formErrors.name = 'Name is required';
      isValid = false;
    } else if (name.trim().length < 3) {
      formErrors.name = 'Name must be at least 3 characters';
      isValid = false;
    }

    // Phone validation
    if (!phone.trim()) {
      formErrors.phone = 'Mobile number is required';
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

    // Confirm password validation
    if (!confirmPassword) {
      formErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  }, [name, phone, password, confirmPassword]);

  // Input submission handlers
  const handleNameSubmit = useCallback(() => {
    phoneInputRef.current?.focus();
  }, []);

  const handlePhoneSubmit = useCallback(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handlePasswordSubmit = useCallback(() => {
    confirmPasswordInputRef.current?.focus();
  }, []);

  // Handle signup
  const handleSignup = useCallback(async () => {
    if (isSubmitting || loading) return;

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const signupData = {
        name: name.trim(),
        phone: phone.trim(),
        password,
        role: 'buyer',
      };

      await register(signupData);

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('LoginScreen'),
        },
      ]);
    } catch (err: any) {
      // Show more specific error message if available
      if (err?.response?.data?.message) {
        Alert.alert('Registration Failed', err.response.data.message);
      } else if (err.message?.includes('Network Error')) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
        );
      }
      // Other errors are already handled in the context
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    phone,
    password,
    navigation,
    register,
    validateForm,
    isSubmitting,
    loading,
  ]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Navigation handler
  const handleNavigateToLogin = useCallback(() => {
    navigation.navigate('LoginScreen');
  }, [navigation]);

  // Terms handler
  const handleTermsAndConditions = useCallback(() => {
    navigation.navigate('TermsAndConditionsScreen');
  }, [navigation]);

  // Check if button should be disabled
  const isButtonDisabled = useMemo(
    () => loading || isSubmitting,
    [loading, isSubmitting],
  );

  // Memoize animated style
  const animatedStyle = useMemo(
    () => ({
      opacity: fadeAnim,
      transform: [{translateY: slideAnim}],
    }),
    [fadeAnim, slideAnim],
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
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <ImageBackground
          style={styles.container}
          source={backgroundImage}
          resizeMode="cover">
          {/* BlurView for glass effect */}
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Utkal International</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.name && styles.inputWrapperError,
                ]}>
                <View style={styles.inputIcon}>
                  <Image
                    source={userIcon}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  onSubmitEditing={handleNameSubmit}
                  autoCapitalize="words"
                  editable={!isSubmitting && !loading}
                />
              </View>
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.phone && styles.inputWrapperError,
                ]}>
                <View style={styles.inputIcon}>
                  <Image
                    source={phoneIcon}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  returnKeyType="next"
                  onSubmitEditing={handlePhoneSubmit}
                  editable={!isSubmitting && !loading}
                  maxLength={15}
                />
              </View>
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputWrapperError,
                ]}>
                <View style={styles.inputIcon}>
                  <Image
                    source={lockIcon}
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
                  returnKeyType="next"
                  onSubmitEditing={handlePasswordSubmit}
                  editable={!isSubmitting && !loading}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={togglePasswordVisibility}
                  activeOpacity={0.7}
                  disabled={isSubmitting || loading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Image
                    source={showPassword ? hidePasswordIcon : showPasswordIcon}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword && styles.inputWrapperError,
                ]}>
                <View style={styles.inputIcon}>
                  <Image
                    source={lockIcon}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  editable={!isSubmitting && !loading}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={toggleConfirmPasswordVisibility}
                  activeOpacity={0.7}
                  disabled={isSubmitting || loading}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Image
                    source={
                      showConfirmPassword ? hidePasswordIcon : showPasswordIcon
                    }
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                isButtonDisabled && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              activeOpacity={0.8}
              disabled={isButtonDisabled}>
              {loading || isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.haveAccountText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={handleNavigateToLogin}
                disabled={isSubmitting || loading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text
                  style={styles.termsLink}
                  onPress={handleTermsAndConditions}>
                  Terms & Conditions
                </Text>{' '}
                and Privacy Policy
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
    backgroundColor: '#000000',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontSize: 18,
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
    borderRadius: 12,
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
  signupButton: {
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
  signupButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
    shadowOpacity: 0.15,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  haveAccountText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '400',
  },
  loginText: {
    color: 'rgba(10, 132, 255, 1)', // Apple iOS blue
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 36,
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

export default SignupScreen;
