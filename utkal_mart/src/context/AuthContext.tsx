import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_CONFIG from '../components/config';

// Define Auth Context types
type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (phone: string, password: string, isSeller: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
  error: string | null;
};

type User = {
  id: number;
  name: string;
  phone: string;
  role: string;
  status: string;
  [key: string]: any; // For other potential user properties
};

type RegisterData = {
  name: string;
  phone: string;
  password: string;
  role: string;
};

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create Auth Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configure axios with timeout and base URL
  useEffect(() => {
    axios.defaults.timeout = 10000; // 10 seconds timeout
    axios.defaults.baseURL = API_CONFIG.BASE_URL;
    axios.defaults.headers.post['Content-Type'] = 'application/json'; // Ensure content type is set
  }, []);

  // Set axios defaults with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user from storage on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@auth_token');
        const storedUser = await AsyncStorage.getItem('@auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          axios.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Error loading auth from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Register a new user
  const register = async (userData: RegisterData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Registering user with data:', {
        ...userData,
        password: '******', // Hide password in logs
      });

      const response = await axios.post(`/api/auth/register`, userData);

      console.log('Registration response:', response.data);

      const {token: newToken, user: newUser} = response.data;

      // Store auth data
      await AsyncStorage.setItem('@auth_token', newToken);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Registration error details:', error);
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage =
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        console.error('Server response:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage =
          'Network error. Please check your connection and try again.';
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login user with debugging improvements
  const login = async (
    phone: string,
    password: string,
    isSeller: boolean,
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Trim whitespace from credentials
      const trimmedPhone = phone.trim();

      console.log('Logging in with:', {
        phone: trimmedPhone,
        password: '*****', // Hide password in logs
        userType: isSeller ? 'seller' : 'buyer',
      });

      // Create explicit payload object
      const payload = {
        phone: trimmedPhone,
        password,
      };

      // Log the complete request URL for debugging
      console.log(`Making request to: ${API_CONFIG.BASE_URL}/api/auth/login`);

      // Create specific headers for this request
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Make the request with explicit options
      const response = await axios.post(`/api/auth/login`, payload, {headers});

      console.log('Login response:', response.data);

      const {token: newToken, user: newUser} = response.data;

      // Check that we received the expected response data
      if (!newToken || !newUser) {
        throw new Error(
          'Invalid response from server - missing token or user data',
        );
      }

      // For the buyer-only app, we still check role to ensure it's a buyer
      // Only if isSeller is false - remove this check if your app handles multiple user types
      if (!isSeller && newUser.role !== 'buyer') {
        console.log('Role mismatch:', {
          expectedRole: 'buyer',
          actualRole: newUser.role,
        });
        throw new Error(`Invalid login. This app is for buyers only.`);
      }

      console.log('Login successful, storing credentials');

      // Store auth data
      await AsyncStorage.setItem('@auth_token', newToken);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login error details:', error);
      let errorMessage = 'Login failed. Please try again.';

      if (error.response) {
        // Server responded with an error
        console.error('Server response status:', error.response.status);
        console.error('Server response headers:', error.response.headers);
        console.error('Server response data:', error.response.data);

        if (error.response.status === 401 || error.response.status === 400) {
          errorMessage =
            'Invalid credentials. Please check your phone number and password.';
        } else {
          errorMessage =
            error.response.data?.error ||
            `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage =
          'Network Error. Please check your connection and try again.';
      } else if (error.message) {
        // Role mismatch or other error with a message
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      // Clear stored auth data
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@auth_user');

      // Reset state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // Remove Authorization header
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Create context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    register,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
