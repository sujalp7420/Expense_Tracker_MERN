import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import expenseService from "../services/expenseService";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import {
  formatCurrency,
  formatDate,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "../utils/formatters";

export const Expenses = () => {
  const { currency } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMethod, setSelectedMethod] = useState("All");

  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialFormState = {
    amount: "",
    category: EXPENSE_CATEGORIES[0],
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

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await expenseService.getAll();
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.message || "Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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
      category: item.category || EXPENSE_CATEGORIES[0],
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
        await expenseService.update(currentId, payload);
        showToast("Expense updated successfully!");
      } else {
        await expenseService.create(payload);
        showToast("Expense created successfully!");
      }

      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      showToast(err.message || "Failed to save expense", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await expenseService.delete(id);
      showToast("Expense deleted successfully!");
      fetchExpenses();
    } catch (err) {
      showToast(err.message || "Failed to delete expense", "error");
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesMethod =
      selectedMethod === "All" || item.paymentMethod === selectedMethod;
    const matchesSearch =
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesMethod && matchesSearch;
  });

  const totalFiltered = filteredExpenses.reduce(
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
          <h1 className="page-title">Expense Management</h1>
          <p className="page-subtitle">Track, filter, and control your day-to-day spending.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* Filter and summary bar */}
      <div className="card filter-card">
        <div className="filter-grid">
          <div className="filter-item search-box">
            <input
              type="text"
              placeholder="Search expenses..."
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
              {EXPENSE_CATEGORIES.map((c) => (
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
            Showing <strong>{filteredExpenses.length}</strong> of{" "}
            <strong>{expenses.length}</strong> records
          </span>
          <span className="summary-total">
            Total: <strong>{formatCurrency(totalFiltered, currency)}</strong>
          </span>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading expenses...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p className="empty-title">No expenses found</p>
            <p className="empty-desc">
              {expenses.length === 0
                ? "You haven't recorded any expenses yet."
                : "No expenses match your search or filter criteria."}
            </p>
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add First Expense
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
                  <th>Category</th>
                  <th>Description & Notes</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>
                      <span className="badge-id">#{item.id}</span>
                    </td>
                    <td>
                      <span className="badge-category">{item.category}</span>
                    </td>
                    <td>
                      <div className="font-medium">{item.description || "—"}</div>
                      {item.notes && <div className="cell-subtext">{item.notes}</div>}
                    </td>
                    <td>{item.paymentMethod || "—"}</td>
                    <td>{formatDate(item.date)}</td>
                    <td className="text-right font-medium amount-expense">
                      -{formatCurrency(item.amount, currency)}
                    </td>
                    <td className="text-center actions-cell">
                      <button
                        className="btn-action edit"
                        onClick={() => openEditModal(item)}
                        title="Edit Expense"
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Expense"
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

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Expense" : "Add Expense"}
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
                {EXPENSE_CATEGORIES.map((c) => (
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
              placeholder="e.g. Flight tickets, Supermarket bill"
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
              placeholder="Optional notes or references..."
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
              {isEditing ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
