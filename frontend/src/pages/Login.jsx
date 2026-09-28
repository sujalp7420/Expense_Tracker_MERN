import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await loginUser(formData);
      if (response?.data) {
        login(response.data);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } else {
        throw new Error(response.message || "Failed to sign in");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-header">
          <div className="brand-logo-icon large">SF</div>
          <h1>Smart Finance Hub</h1>
          <p className="auth-subtitle">Sign in to take command of your finances</p>
        </div>

        {error && <div className="alert-message alert-error">{error}</div>}
        {success && <div className="alert-message alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer-link">
          <span>Don't have an account? </span>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;