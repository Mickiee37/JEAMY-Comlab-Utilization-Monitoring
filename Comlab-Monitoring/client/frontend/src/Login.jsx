import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase"; // Import auth and provider from firebase.js
import { useNavigate } from "react-router-dom"; // For navigation
import axios from "axios"; // Import axios for making API calls
import ReCAPTCHA from "react-google-recaptcha"; // Import the reCAPTCHA component
import './Login.css';
import { login } from "./authUtils"; // Import the login utility

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaValue, setRecaptchaValue] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0); // Track login attempts
  const navigate = useNavigate();

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Starting Google sign-in process...");
      
      // Configure Google provider with prompt parameter
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful:", result);
      
      const user = result.user;
      console.log("User Info:", user);
      
      // Get ID token to pass to backend
      const idToken = await user.getIdToken();
      console.log("ID token retrieved, sending to backend");
      
      // Send the token and user info to the backend
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/login/google`, {
          idToken,
          email: user.email,
          name: user.displayName,
          googleId: user.uid
        });
        
        console.log('Backend authentication successful:', response.data);
        
        // Store user data from backend response
        if (response.data.user && response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Set authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          
          // Redirect based on user role
          const userRole = response.data.user.role;
          if (userRole === 'admin') {
            navigate('/app'); // Admin dashboard
          } else {
            navigate('/InstructorDashboard'); // Instructor dashboard for regular users
          }
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (backendError) {
        console.error("Backend authentication error:", backendError);
        setError("Server authentication failed. Please try again or use email login.");
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      
      // More specific error messages based on Firebase error codes
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked by your browser. Please allow pop-ups for this site.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with the same email address but different sign-in credentials.");
      } else {
        setError(`Google Sign-In failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Login Handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);

    try {
      // Validate recaptcha
      if (!recaptchaValue) {
        setError("Please complete the reCAPTCHA verification.");
        setIsLoading(false);
        return;
      }

      const response = await login(email, password);
      console.log('Login successful:', response);

      // Store user data
      if (response.user && response.token) {
        // Redirect based on user role
        if (response.user.role === 'admin') {
          navigate('/app'); // Admin dashboard
        } else {
          navigate('/InstructorDashboard'); // Instructor dashboard for regular users
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-image">
        <img src="BG2.png" alt="Building" />
      </div>
      <div className="login-form">
        <img src="COTLOGO.png" alt="Logo" className="login-logo" />
        <h1>BUKSU</h1>
        <p className="com">Computer Laboratory Monitoring System</p>

        {/* Google Login */}
        <button
          onClick={handleGoogleSignIn}
          className="google-login"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : (
            <>
              <img src="google.png" alt="Google icon" className="google-icon" />
              Continue with Google
            </>
          )}
        </button>

        {/* Email/Password Login */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="show-password">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label htmlFor="showPassword">Show Password</label>
          </div>
          <ReCAPTCHA
            sitekey="6Leo5IQqAAAAAFgqYPT72ORc-4tOpj3iJ_vdYGfM"
            onChange={setRecaptchaValue}
          />
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Error Messages */}
        {error && <p className="error-message">{error}</p>}

        {/* Reset Password Link (only after 3 failed attempts) */}
        {loginAttempts >= 3 && (
          <p className="reset-password-link">
            <a href="/reset-password">Reset your password here</a>
          </p>
        )}

        {/* Links */}
        <div className="login-links">
          <p className="register-link">
            Don't have an account? <a href="/register">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
