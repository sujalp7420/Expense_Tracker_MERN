import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import Toast from "../components/Toast";

const CURRENCIES = [
  { code: "INR", label: "INR - Indian Rupee (₹)" },
  { code: "USD", label: "USD - US Dollar ($)" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "GBP", label: "GBP - British Pound (£)" },
  { code: "AUD", label: "AUD - Australian Dollar (A$)" },
  { code: "CAD", label: "CAD - Canadian Dollar (C$)" },
  { code: "JPY", label: "JPY - Japanese Yen (¥)" },
];

export const Profile = () => {
  const { user, updateUserData, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currency: user?.currency || "INR",
    newPassword: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.userId) {
      showToast("User ID not found in session", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        currency: formData.currency,
      };

      if (formData.newPassword.trim()) {
        payload.password = formData.newPassword.trim();
      }

      const res = await userService.updateProfile(user.userId, payload);
      const updated = res.data || payload;

      updateUserData({
        name: updated.name,
        currency: updated.currency,
      });

      setFormData((prev) => ({ ...prev, newPassword: "" }));
      showToast("Profile settings updated successfully!");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile & Preferences</h1>
          <p className="page-subtitle">
            Manage your account settings, currency preferences, and credentials.
          </p>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Profile Card */}
        <div className="card dashboard-card flex-2">
          <div className="card-header">
            <h2 className="card-title">Personal Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                disabled
                value={formData.email}
                title="Email cannot be changed directly"
              />
              <small className="form-hint">Email is linked to your account.</small>
            </div>

            <div className="form-group">
              <label>Default Currency</label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                All dashboard amounts, budgets, and transactions format in this currency.
              </small>
            </div>

            <div className="form-group">
              <label>Change Password</label>
              <input
                type="password"
                placeholder="Leave blank to keep current password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving Changes..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info Card */}
        <div className="card dashboard-card flex-1">
          <div className="card-header">
            <h2 className="card-title">Account Summary</h2>
          </div>

          <div className="account-details-list">
            {/* <div className="detail-item">
              <span className="detail-label">User ID:</span>
              <strong className="detail-val">#{user?.userId || "—"}</strong>
            </div> */}

            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="status-pill good">Active</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Current Currency:</span>
              <strong className="detail-val">{formData.currency}</strong>
            </div>
          </div>

          <div className="account-danger-zone">
            <h4>Session</h4>
            <p>Ready to end your current session?</p>
            <button className="btn btn-outline" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
