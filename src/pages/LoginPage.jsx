import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(form.identifier, form.password);
      navigate(result.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Login with your phone number or Gmail"
      subtitle="Customers can sign in to browse the dashboard, and admins can manage banners and menu items from the same account system."
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Phone number or Gmail
          <input
            type="text"
            placeholder="9876543210 or yourname@gmail.com"
            value={form.identifier}
            onChange={(event) => setForm({ ...form, identifier: event.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button wide-button" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="helper-text"><Link to="/forgot-password">Forgot password?</Link></p>
        <p className="helper-text">New here? <Link to="/register">Create your account</Link></p>
      </form>
    </AuthCard>
  );
}
