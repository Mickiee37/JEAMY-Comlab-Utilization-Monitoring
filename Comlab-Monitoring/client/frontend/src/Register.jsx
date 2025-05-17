import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validation functions
  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@student\.buksu\.edu\.ph$/.test(email);
  const isValidPhoneNumber = (phone) => /^09\d{9}$/.test(phone);
  const isValidPassword = (password) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*-_]).{10,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    const { email, phoneNumber, password, confirmPassword } = formData;
    const newErrors = {};

    // Validations
    if (!isValidEmail(email)) newErrors.email = "Email must end with @student.buksu.edu.ph.";
    if (!isValidPhoneNumber(phoneNumber)) newErrors.phoneNumber = "Phone number must start with 09 and be 11 digits.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match!";
    if (!isValidPassword(password)) {
      newErrors.password =
        "Password must be at least 10 characters, contain uppercase, lowercase, a number, and a special character.";
    }

    // Stop if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        {
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        }
      );      
      setSuccessMessage(response.data.message);
      setTimeout(() => navigate("/login"), 2000); // Redirect to login after success
    } catch (err) {
      setErrors({ api: err.response?.data?.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-image">
        <img src="BG2.png" alt="Building" />
      </div>
      <div className="register-form">
        <img src="COTLOGO.png" alt="Logo" className="register-logo" />
        <h1>BUKSU</h1>
        <p className="com">Computer Laboratory Monitoring System</p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => {
                const formattedNumber = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                setFormData({ ...formData, phoneNumber: formattedNumber });
              }}
              placeholder="Phone Number (e.g., 09XXXXXXXXX)"
              required
            />
            {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
          </div>

          {/* Password */}
          <div>
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
            <div className="show-password">
              <input
                type="checkbox"
                id="showPassword"
                checked={passwordVisible}
                onChange={() => setPasswordVisible(!passwordVisible)}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
            />
            <div className="show-password">
              <input
                type="checkbox"
                id="showConfirmPassword"
                checked={confirmPasswordVisible}
                onChange={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              />
              <label htmlFor="showConfirmPassword">Show Confirm Password</label>
            </div>
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          {/* Success and Error Messages */}
          {successMessage && <p className="success-message">{successMessage}</p>}
          {errors.api && <p className="error-message">{errors.api}</p>}
        </form>

        <p className="login-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
