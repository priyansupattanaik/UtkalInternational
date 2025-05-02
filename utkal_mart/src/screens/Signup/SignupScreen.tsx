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
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {BlurView} from '@react-native-community/blur';

const {width, height} = Dimensions.get('window');

const SignupScreen = ({navigation}) => {
  // State management
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const confirmLockIcon = useMemo(
    () => require('../../assets/images/icons/password.png'),
    [],
  );

  // Show/hide password icons
  const showPasswordIcon = useMemo(
    () => require('../../assets/images/icons/unhide.png'),
    [],
  );
  const hidePasswordIcon = useMemo(
    () => require('../../assets/images/icons/hide.png'),
    [],
  );

  // Animation setup
  useEffect(() => {
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
      animation.stop();
    };
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const formErrors = {};
    let isValid = true;

    if (!name.trim()) {
      formErrors.name = 'Name is required';
      isValid = false;
    }

    if (!phone.trim()) {
      formErrors.phone = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phone.trim())) {
      formErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    if (!password) {
      formErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  }, [name, phone, password, confirmPassword]);

  // Handle signup
  const handleSignup = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const signupData = {
        name,
        phone,
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
    } catch (err) {
      // Error is already handled in the context
    }
  }, [name, phone, password, navigation, register, validateForm]);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ImageBackground
          style={styles.container}
          source={backgroundImage}
          resizeMode="cover">
          {/* BlurView for glass effect */}
          <BlurView
            style={styles.blurOverlay}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
          />

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Utkal International</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Image
                    source={userIcon}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Image
                    source={phoneIcon}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.phone ? styles.inputError : null,
                  ]}
                  placeholder="Mobile Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Image
                    source={lockIcon}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.password ? styles.inputError : null,
                  ]}
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
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Image
                    source={confirmLockIcon}
                    style={styles.visibilityIcon}
                    resizeMode="contain"
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword ? styles.inputError : null,
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={toggleConfirmPasswordVisibility}
                  activeOpacity={0.7}>
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
              style={styles.loginButton}
              onPress={handleSignup}
              activeOpacity={0.8}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleNavigateToLogin}>
                <Text style={styles.signUpText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 10,
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
  inputIcon: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  visibilityIcon: {
    width: 22,
    height: 22,
    tintColor: 'rgba(255, 255, 255, 0.8)',
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

export default SignupScreen;
