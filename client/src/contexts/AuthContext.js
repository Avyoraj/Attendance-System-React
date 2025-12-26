import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Request Queue implementation for high traffic scenarios
class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  add(requestFn) {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.queue.push({
        requestFn,
        resolve,
        reject
      });
      
      // Process queue
      this.processQueue();
    });
  }

  async processQueue() {
    // If we're already at max concurrent requests, wait
    if (this.running >= this.maxConcurrent) {
      return;
    }

    // Get next request from queue
    const request = this.queue.shift();
    if (!request) {
      return;
    }

    // Execute request
    try {
      this.running++;
      const result = await request.requestFn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.running--;
      this.processQueue();
    }
  }
}

// Create global request queue instance
const requestQueue = new RequestQueue(8); // Allow 8 concurrent requests

// Throttling utility to limit request frequency
class RequestThrottler {
  constructor() {
    this.timestamps = {};
    this.minIntervals = {
      default: 300, // 300ms minimum between general requests
      '/api/auth/': 2000, // 2 seconds between auth requests
      '/api/students': 500, // 500ms between student data requests
      '/api/classes': 500, // 500ms between class data requests
    };
  }

  // Check if a request should be throttled
  shouldThrottle(url) {
    const now = Date.now();
    let minInterval = this.minIntervals.default;
    
    // Find the appropriate minimum interval for this URL
    Object.entries(this.minIntervals).forEach(([endpoint, interval]) => {
      if (url.includes(endpoint) && interval > minInterval) {
        minInterval = interval;
      }
    });
    
    // Check if enough time has passed since the last request to this endpoint
    const lastTimestamp = this.timestamps[url] || 0;
    const timeSinceLastRequest = now - lastTimestamp;
    
    if (timeSinceLastRequest < minInterval) {
      return true; // Should throttle
    }
    
    // Update timestamp and allow request
    this.timestamps[url] = now;
    return false;
  }

  // Get delay time if throttled
  getDelayTime(url) {
    const now = Date.now();
    let minInterval = this.minIntervals.default;
    
    // Find the appropriate minimum interval for this URL
    Object.entries(this.minIntervals).forEach(([endpoint, interval]) => {
      if (url.includes(endpoint) && interval > minInterval) {
        minInterval = interval;
      }
    });
    
    const lastTimestamp = this.timestamps[url] || 0;
    return Math.max(0, minInterval - (now - lastTimestamp));
  }
}

// Create global throttler instance
const requestThrottler = new RequestThrottler();

// Response caching utility to reduce duplicate API calls
class ResponseCache {
  constructor(maxCacheSize = 50, defaultTTL = 60000) { // Default TTL: 1 minute
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
    this.defaultTTL = defaultTTL;
    this.ttlConfig = {
      '/api/students': 120000, // 2 minutes
      '/api/classes': 120000, // 2 minutes
      '/api/teachers': 300000, // 5 minutes
      '/api/dashboard': 60000, // 1 minute
    };
  }

  // Get TTL for a specific URL
  getTTL(url) {
    for (const [endpoint, ttl] of Object.entries(this.ttlConfig)) {
      if (url.includes(endpoint)) {
        return ttl;
      }
    }
    return this.defaultTTL;
  }

  // Generate cache key from request config
  generateKey(config) {
    // For GET requests, include URL and params in the key
    if (config.method === 'get' || !config.method) {
      const params = config.params ? JSON.stringify(config.params) : '';
      return `${config.url}|${params}`;
    }
    // For non-GET requests, don't cache
    return null;
  }

  // Check if request is cacheable
  isCacheable(config) {
    // Only cache GET requests
    if (config.method && config.method !== 'get') {
      return false;
    }
    
    // Don't cache auth requests
    if (config.url?.includes('/api/auth/')) {
      return false;
    }
    
    // Don't cache if explicitly marked as no-cache
    if (config.cache === false) {
      return false;
    }
    
    return true;
  }

  // Get cached response
  get(config) {
    if (!this.isCacheable(config)) {
      return null;
    }
    
    const key = this.generateKey(config);
    if (!key) return null;
    
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;
    
    // Check if cache has expired
    if (Date.now() > cachedItem.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.response;
  }

  // Set cached response
  set(config, response) {
    if (!this.isCacheable(config)) {
      return;
    }
    
    const key = this.generateKey(config);
    if (!key) return;
    
    // Manage cache size - remove oldest entry if at capacity
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // Calculate expiry time
    const ttl = this.getTTL(config.url || '');
    const expiry = Date.now() + ttl;
    
    // Store response with expiry time
    this.cache.set(key, {
      response: response,
      expiry: expiry
    });
  }

  // Clear cache for specific URL pattern or all cache
  clear(urlPattern = null) {
    if (!urlPattern) {
      this.cache.clear();
      return;
    }
    
    // Delete entries matching the URL pattern
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create global cache instance
const responseCache = new ResponseCache();

// Set the base URL for all axios requests
// Updated to use the unified attendance-backend
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Add request/response interceptors for better error handling

// Track ongoing requests to prevent duplicates
const pendingRequests = new Map();

// Create a custom axios instance for queued requests
const queuedAxios = axios.create();

// Override axios methods to use the queue and throttling for important endpoints
const originalRequest = axios.request;
axios.request = function(config) {
  // Check if this is a critical endpoint that should be queued
  const criticalEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/students',
    '/api/classes',
    '/api/attendance'
  ];
  
  const shouldQueue = criticalEndpoints.some(endpoint => 
    config.url?.includes(endpoint)
  );
  
  // Apply throttling
  if (config.url && requestThrottler.shouldThrottle(config.url)) {
    const delayTime = requestThrottler.getDelayTime(config.url);
    
    // Return a promise that resolves after the throttle delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // After delay, either queue or execute directly
        if (shouldQueue) {
          resolve(requestQueue.add(() => originalRequest.call(axios, config)));
        } else {
          resolve(originalRequest.call(axios, config));
        }
      }, delayTime);
    });
  }
  
  // If not throttled but should be queued
  if (shouldQueue) {
    return requestQueue.add(() => originalRequest.call(axios, config));
  }
  
  // Non-critical and non-throttled requests proceed normally
  return originalRequest.call(axios, config);
};

// Request interceptor to prevent duplicate requests
axios.interceptors.request.use(
  config => {
    const requestKey = `${config.method}:${config.url}${JSON.stringify(config.params || {})}`;
    
    // Cancel previous identical requests that are still pending
    if (pendingRequests.has(requestKey)) {
      const controller = pendingRequests.get(requestKey);
      controller.abort();
      pendingRequests.delete(requestKey);
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(requestKey, controller);
    
    // Add request timestamp for potential retry logic
    config.metadata = { startTime: new Date().getTime() };
    
    return config;
  },
  error => Promise.reject(error)
);

// Request interceptor for caching and duplicate prevention
axios.interceptors.request.use(
  async config => {
    // Check cache for GET requests
    const cachedResponse = responseCache.get(config);
    if (cachedResponse) {
      // Return cached response in a way that axios interceptors can handle
      return Promise.reject({
        __CACHED_RESPONSE__: true,
        response: cachedResponse
      });
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor with retry logic for rate limiting and network errors
axios.interceptors.response.use(
  response => {
    // Clear from pending requests map on success
    const requestKey = `${response.config.method}:${response.config.url}${JSON.stringify(response.config.params || {})}`;
    pendingRequests.delete(requestKey);
    
    // Cache successful GET responses
    responseCache.set(response.config, response);
    
    return response;
  },
  async error => {
    // Handle cached responses
    if (error.__CACHED_RESPONSE__) {
      return error.response;
    }
    
    const { config } = error;
    
    // Clear from pending requests map
    if (config) {
      const requestKey = `${config.method}:${config.url}${JSON.stringify(config.params || {})}`;
      pendingRequests.delete(requestKey);
    }
    
    // Don't retry if request was cancelled or no config exists
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || !config) {
      // Silently reject canceled requests - don't show error toast
      return Promise.reject(error);
    }
    
    // Initialize retry count if not present
    config.retryCount = config.retryCount || 0;
    
    // Define retry conditions
    const shouldRetry = (
      // Retry on network errors
      !error.response ||
      // Retry on rate limit errors (429)
      error.response.status === 429 ||
      // Retry on server errors (5xx)
      (error.response.status >= 500 && error.response.status <= 599)
    );
    
    // Maximum retry attempts
    const MAX_RETRIES = 3;
    
    if (shouldRetry && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      
      // Exponential backoff delay: 1s, 2s, 4s, etc.
      const delay = Math.pow(2, config.retryCount - 1) * 1000;
      
      // Show retry notification for user feedback
      if (error.response?.status === 429) {
        toast.error(`Rate limit exceeded. Retrying in ${delay/1000}s...`, { id: `retry-${config.url}` });
      }
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return axios(config);
    }
    
    // Log the error for debugging (but not canceled requests)
    if (error.code !== 'ERR_CANCELED') {
      console.error('API Error:', error);
    }
    
    // Show user-friendly error message (but not for canceled requests)
    if (error.code === 'ERR_CANCELED') {
      // Silently ignore canceled requests
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

// Helper function to invalidate cache for specific endpoints
function invalidateCache(endpoints) {
  if (!endpoints || !Array.isArray(endpoints)) {
    // If no specific endpoints provided, clear all cache
    responseCache.clear();
    return;
  }
  
  // Clear cache for each specified endpoint
  endpoints.forEach(endpoint => {
    responseCache.clear(endpoint);
  });
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };
  
  // Expose cache invalidation to components
  const clearCache = (endpoints) => {
    invalidateCache(endpoints);
  };

  const login = async (email, password, role) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password, role });
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      // Clear all cache on login to ensure fresh data
      invalidateCache();
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, name, role) => {
    try {
      const response = await axios.post('/api/auth/register', { email, password, name, role });
      // Invalidate relevant caches after registration
      invalidateCache(['/api/students', '/api/teachers', '/api/classes']);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };


  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      toast.success('Verification code sent to your email');
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error.response?.data?.error || 'Failed to send verification code';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyResetCode = async (email, code) => {
    try {
      const response = await axios.post('/api/auth/verify-reset-code', { email, code });
      toast.success('Verification code confirmed!');
      return { success: true };
    } catch (error) {
      console.error('Verify reset code error:', error);
      const message = error.response?.data?.error || 'Invalid verification code';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (email, code, password) => {
    try {
      await axios.post('/api/auth/reset-password', { email, code, password });
      toast.success('Password reset successful!');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error.response?.data?.error || 'Failed to reset password';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    // Clear all cache on logout
    invalidateCache();
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword
  };

  return (
    <AuthContext.Provider value={{
      user, 
      isAuthenticated, 
      loading, 
      login, 
      register, 
      logout, 
      forgotPassword, 
      verifyResetCode,
      resetPassword,
      clearCache // Expose cache invalidation to components
    }}>
      {children}
    </AuthContext.Provider>
  );
};
