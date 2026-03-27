import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email && !form.phone) {
      setError("Please add either a Gmail address or phone number.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your Saha Food account"
      subtitle="Use a Gmail address, a mobile number, or both. After signup you can browse the food dashboard immediately."
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Gmail address
          <input
            type="email"
            placeholder="yourname@gmail.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Phone number
          <input
            type="text"
            placeholder="9876543210"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button wide-button" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
        <p className="helper-text">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </AuthCard>
  );
}
