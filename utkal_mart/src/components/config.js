// API Configuration with enhanced options
const API_CONFIG = {
  BASE_URL: 'http://192.168.29.34:5000',
  TIMEOUT: 15000, // Increased timeout to 15 seconds
  RETRY_ATTEMPTS: 2, // Add retry attempts for failed requests
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export default API_CONFIG;
