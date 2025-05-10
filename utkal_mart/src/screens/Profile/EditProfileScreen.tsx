import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ImageBackground,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import axios from 'axios';
import API_CONFIG from '../../components/config';
import {BlurView} from '@react-native-community/blur';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const {user, token} = useAuth();

  // State management - combined with memoization
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Memoized icon sources
  const backIcon = useMemo(
    () => require('../../assets/images/pageicons/arrow.png'),
    [],
  );
  const backgroundImage = useMemo(
    () => require('../../assets/images/backgrounds/bg1.png'),
    [],
  );

  // Handle form input changes - memoized
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Load initial user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      }));

      fetchProfileData();
    }
  }, [user]);

  // Fetch profile data from API - memoized
  const fetchProfileData = useCallback(async () => {
    if (!user || !token) return;

    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setFormData(prev => ({
          ...prev,
          name: response.data.name || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setInitialLoading(false);
    }
  }, [user, token]);

  // Form validation - memoized
  const validateForm = useCallback(() => {
    const {name, phone, currentPassword, newPassword, confirmPassword} =
      formData;
    let formErrors = {};
    let isValid = true;

    if (!name.trim()) {
      formErrors.name = 'Name is required';
      isValid = false;
    }

    if (!phone.trim()) {
      formErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phone.trim())) {
      formErrors.phone = 'Please enter a valid phone number (10-15 digits)';
      isValid = false;
    }

    // Password validation (only if attempting to change password)
    if (newPassword) {
      if (!currentPassword) {
        formErrors.currentPassword = 'Current password is required';
        isValid = false;
      }

      if (newPassword.length < 6) {
        formErrors.newPassword = 'Password must be at least 6 characters';
        isValid = false;
      }

      if (newPassword !== confirmPassword) {
        formErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setErrors(formErrors);
    return isValid;
  }, [formData]);

  // Update profile handler - memoized
  const handleUpdateProfile = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const {name, phone, email, currentPassword, newPassword} = formData;
      let userData = {name, phone};

      if (email) {
        userData.email = email;
      }

      // Add password change if requested
      if (newPassword) {
        userData.currentPassword = currentPassword;
        userData.newPassword = newPassword;
      }

      await axios.put(
        `${API_CONFIG.BASE_URL}/api/auth/update-profile`,
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error.response?.data?.error ||
        'Something went wrong. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, token, navigation]);

  // Navigate back handler - memoized
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Loading screen
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}>
        <ImageBackground
          source={backgroundImage}
          style={styles.container}
          resizeMode="cover">
          {/* Background overlay with blur effect */}
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.overlayBackground}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
            />
          ) : (
            <View style={styles.overlayBackground} />
          )}

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.7}>
              <Image
                source={backIcon}
                style={styles.backIcon}
                tintColor="#FFFFFF"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT PROFILE</Text>
            <View style={{width: 40}} />
          </View>

          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.name && styles.inputContainerError,
                  ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255, 255, 255, 0.27)"
                    value={formData.name}
                    onChangeText={value => handleChange('name', value)}
                  />
                </View>
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.phone && styles.inputContainerError,
                  ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="rgba(255, 255, 255, 0.27)"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={value => handleChange('phone', value)}
                  />
                </View>
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>
            </View>

            {/* Change Password */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                Change Password (Optional)
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.currentPassword && styles.inputContainerError,
                  ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password"
                    placeholderTextColor="rgba(255, 255, 255, 0.27)"
                    secureTextEntry
                    value={formData.currentPassword}
                    onChangeText={value =>
                      handleChange('currentPassword', value)
                    }
                  />
                </View>
                {errors.currentPassword && (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.newPassword && styles.inputContainerError,
                  ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="rgba(255, 255, 255, 0.27)"
                    secureTextEntry
                    value={formData.newPassword}
                    onChangeText={value => handleChange('newPassword', value)}
                  />
                </View>
                {errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.confirmPassword && styles.inputContainerError,
                  ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry
                    value={formData.confirmPassword}
                    onChangeText={value =>
                      handleChange('confirmPassword', value)
                    }
                  />
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleUpdateProfile}
              activeOpacity={0.8}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={{height: 20}} />
          </ScrollView>
        </ImageBackground>
      </KeyboardAvoidingView>
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
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    zIndex: 1,
  },
  formCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContainerError: {
    borderColor: 'rgba(255, 59, 48, 0.7)',
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default EditProfileScreen;
