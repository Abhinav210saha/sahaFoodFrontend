import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { AuthCard } from "../components/AuthCard";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await api.requestForgotPasswordOtp({ identifier });
      setMessage(result.devOtp ? `OTP sent. Demo OTP: ${result.devOtp}` : result.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await api.resetPasswordWithOtp({ identifier, otp, newPassword });
      setMessage(result.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Verify with OTP on your registered phone or email, then set a new password."
    >
      {step === 1 ? (
        <form className="stack-form" onSubmit={sendOtp}>
          <label>
            Phone number or Gmail
            <input
              type="text"
              placeholder="9876543210 or yourname@gmail.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
          <button className="primary-button wide-button" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
          <p className="helper-text"><Link to="/login">Back to login</Link></p>
        </form>
      ) : (
        <form className="stack-form" onSubmit={resetPassword}>
          <label>
            OTP
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
          <button className="primary-button wide-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <p className="helper-text"><button type="button" className="text-button" onClick={() => setStep(1)}>Resend OTP</button></p>
        </form>
      )}
    </AuthCard>
  );
}
