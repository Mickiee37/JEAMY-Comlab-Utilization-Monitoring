import axios from 'axios';

// Store auth token in localStorage
export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Get auth token from localStorage
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// Remove auth token from localStorage
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

// Store user data in localStorage
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Get user data from localStorage
export const getUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Remove user data from localStorage
export const removeUser = () => {
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Check if user has admin role
export const isAdmin = () => {
  const user = getUser();
  return user && user.role === 'admin';
};

// Check if user has instructor role
export const isInstructor = () => {
  const user = getUser();
  return user && (user.role === 'instructor' || user.role === 'admin');
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/login`,
      { email, password }
    );
    setToken(response.data.token);
    setUser(response.data.user);
    
    // Add token to all future axios requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/login/logout`
    );
    removeToken();
    removeUser();
    delete axios.defaults.headers.common['Authorization'];
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if the server request fails, clear local storage
    removeToken();
    removeUser();
    delete axios.defaults.headers.common['Authorization'];
    throw error;
  }
};

// Initialize auth - call this when app starts
export const initAuth = () => {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Create an axios instance that includes the auth token
export const authAxios = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Add interceptor to include token in each request
authAxios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
); 