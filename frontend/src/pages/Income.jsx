import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import incomeService from "../services/incomeService";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import {
  formatCurrency,
  formatDate,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "../utils/formatters";

export const Income = () => {
  const { currency } = useAuth();

  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMethod, setSelectedMethod] = useState("All");

  // Modal & form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialFormState = {
    amount: "",
    source: "",
    category: INCOME_CATEGORIES[0],
    paymentMethod: PAYMENT_METHODS[0],
    date: new Date().toISOString().slice(0, 10),
    description: "",
    notes: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchIncome = useCallback(async () => {
    try {
      setLoading(true);
      const res = await incomeService.getAll();
      setIncomes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.message || "Failed to load income records", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      amount: item.amount,
      source: item.source || "",
      category: item.category || INCOME_CATEGORIES[0],
      paymentMethod: item.paymentMethod || PAYMENT_METHODS[0],
      date: item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: item.description || "",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (isEditing) {
        await incomeService.update(currentId, payload);
        showToast("Income record updated successfully!");
      } else {
        await incomeService.create(payload);
        showToast("Income record created successfully!");
      }

      setIsModalOpen(false);
      fetchIncome();
    } catch (err) {
      showToast(err.message || "Failed to save income", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income entry?")) {
      return;
    }

    try {
      await incomeService.delete(id);
      showToast("Income deleted successfully!");
      fetchIncome();
    } catch (err) {
      showToast(err.message || "Failed to delete income", "error");
    }
  };

  // Filtered income
  const filteredIncomes = incomes.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesMethod =
      selectedMethod === "All" || item.paymentMethod === selectedMethod;
    const matchesSearch =
      (item.source || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesMethod && matchesSearch;
  });

  const totalFiltered = filteredIncomes.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );

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
          <h1 className="page-title">Income Management</h1>
          <p className="page-subtitle">Track your revenue streams, paychecks, and returns.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Income
          </button>
        </div>
      </div>

      {/* Filter and summary bar */}
      <div className="card filter-card">
        <div className="filter-grid">
          <div className="filter-item search-box">
            <input
              type="text"
              placeholder="Search by source or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="All">All Payment Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-summary-row">
          <span>
            Showing <strong>{filteredIncomes.length}</strong> of{" "}
            <strong>{incomes.length}</strong> records
          </span>
          <span className="summary-total">
            Total Income: <strong>{formatCurrency(totalFiltered, currency)}</strong>
          </span>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading income streams...</p>
        </div>
      ) : filteredIncomes.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p className="empty-title">No income records found</p>
            <p className="empty-desc">
              {incomes.length === 0
                ? "You haven't added any income records yet."
                : "No records match your current filters."}
            </p>
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add First Income
            </button>
          </div>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Description & Notes</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>
                      <span className="badge-id">#{item.id}</span>
                    </td>
                    <td>
                      <strong>{item.source}</strong>
                    </td>
                    <td>
                      <span className="badge-category income-cat">
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <div>{item.description || "—"}</div>
                      {item.notes && <div className="cell-subtext">{item.notes}</div>}
                    </td>
                    <td>{item.paymentMethod || "—"}</td>
                    <td>{formatDate(item.date)}</td>
                    <td className="text-right font-medium amount-income">
                      +{formatCurrency(item.amount, currency)}
                    </td>
                    <td className="text-center actions-cell">
                      <button
                        className="btn-action edit"
                        onClick={() => openEditModal(item)}
                        title="Edit Income"
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Income"
                      >
                        ✕ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Income Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Income Record" : "Add Income Record"}
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label>Amount ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Income Source *</label>
            <input
              type="text"
              required
              placeholder="e.g. Primary Salary, Client Project, Stock Dividend"
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="e.g. March Payroll, Freelance Milestone #2"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="2"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? "Update Income" : "Save Income"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Income;
