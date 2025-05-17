import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css"; // Link to the CSS file

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

const ResetPassword = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  const validateAndFormatPhoneNumber = (number) => {
    if (/^09\d{9}$/.test(number)) {
      return "+63" + number.substring(1);
    }
    if (/^\+639\d{9}$/.test(number)) {
      return number;
    }
    return null;
  };

  const isValidPassword = (password) => {
    const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*-_])/;
    return pattern.test(password);
  };

  const startCountdown = () => {
    let timeLeft = 30;
    setCountdown(timeLeft);
    const timer = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) clearInterval(timer);
    }, 1000);
  };

  const handleApiCall = async (apiFunc, onSuccess) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await apiFunc();
      if (response.data.success) {
        onSuccess(response);
      } else {
        setError(response.data.message || "An error occurred. Please try again.");
      }
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendResetOtp = () => {
    const formattedPhoneNumber = validateAndFormatPhoneNumber(phoneNumber);
    if (!formattedPhoneNumber) {
      setError("Invalid phone number format.");
      return;
    }
    handleApiCall(
      () =>
        axiosInstance.post("/api/reset-password/send-reset-otp", {
          phoneNumber: formattedPhoneNumber,
        }),
      () => {
        setStep(2);
        startCountdown();
        setSuccessMessage("OTP sent successfully. Please check your phone.");
      }
    );
  };

  const verifyResetOtp = () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    const formattedPhoneNumber = validateAndFormatPhoneNumber(phoneNumber);
    if (!formattedPhoneNumber) {
      setError("Invalid phone number format.");
      return;
    }
    handleApiCall(
      () =>
        axiosInstance.post("/api/reset-password/verify-reset-otp", {
          phoneNumber: formattedPhoneNumber,
          otp,
        }),
      () => {
        setStep(3);
        setSuccessMessage("OTP verified successfully.");
      }
    );
  };

  const resetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*-_)."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const formattedPhoneNumber = validateAndFormatPhoneNumber(phoneNumber);
    if (!formattedPhoneNumber) {
      setError("Invalid phone number format.");
      return;
    }

    handleApiCall(
      () =>
        axiosInstance.post("/api/reset-password/reset-password", {
          phoneNumber: formattedPhoneNumber,
          newPassword,
        }),
      () => {
        setSuccessMessage("Password reset successfully!");
        setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
      }
    );
  };

  return (
    <div className="reset-password-container">
      <h1>Reset Password</h1>
      {step === 1 && (
        <div>
          <input
            type="text"
            placeholder="Enter your phone number (090XXXXXXXX or +639XXXXXXXXX)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading}
          />
          <button onClick={sendResetOtp} disabled={isLoading || countdown > 0}>
            {isLoading ? "Sending OTP..." : countdown > 0 ? `Resend OTP in ${countdown}s` : "Send OTP"}
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <input
            type="text"
            placeholder="Enter the OTP sent to your phone"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isLoading}
          />
          <button onClick={verifyResetOtp} disabled={isLoading}>
            {isLoading ? "Verifying OTP..." : "Verify OTP"}
          </button>
        </div>
      )}
      {step === 3 && (
        <div>
          <div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            <label>
              <input
                type="checkbox"
                onChange={() => setShowPassword(!showPassword)}
                checked={showPassword}
              />{" "}
              Show Password
            </label>
          </div>
          <div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <label>
              <input
                type="checkbox"
                onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                checked={showConfirmPassword}
              />{" "}
              Show Confirm Password
            </label>
          </div>
          <button onClick={resetPassword} disabled={isLoading}>
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default ResetPassword;
