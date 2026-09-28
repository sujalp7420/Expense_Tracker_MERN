import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import budgetService from "../services/budgetService";
import expenseService from "../services/expenseService";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import {
  formatCurrency,
  EXPENSE_CATEGORIES,
  MONTHS,
} from "../utils/formatters";

export const Budgets = () => {
  const { currency } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialFormState = {
    month: currentMonth,
    year: currentYear,
    category: EXPENSE_CATEGORIES[0],
    limit: "",
    alertPercentage: 80,
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [budRes, expRes] = await Promise.all([
        budgetService.getAll(),
        expenseService.getAll(),
      ]);
      setBudgets(Array.isArray(budRes.data) ? budRes.data : []);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
    } catch (err) {
      showToast(err.message || "Failed to load budget data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      ...initialFormState,
      month: selectedMonth,
      year: selectedYear,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      month: item.month,
      year: item.year,
      category: item.category || EXPENSE_CATEGORIES[0],
      limit: item.limit,
      alertPercentage: item.alertPercentage || 80,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        month: Number(formData.month),
        year: Number(formData.year),
        category: formData.category,
        limit: Number(formData.limit),
        alertPercentage: Number(formData.alertPercentage) || 80,
      };

      if (isEditing) {
        await budgetService.update(currentId, payload);
        showToast("Budget updated successfully!");
      } else {
        await budgetService.create(payload);
        showToast("Budget created successfully!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || "Failed to save budget", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      await budgetService.delete(id);
      showToast("Budget deleted successfully!");
      fetchData();
    } catch (err) {
      showToast(err.message || "Failed to delete budget", "error");
    }
  };

  // Filter budgets by selected month & year
  const filteredBudgets = budgets.filter(
    (b) => Number(b.month) === Number(selectedMonth) && Number(b.year) === Number(selectedYear)
  );

  // Filter expenses for this period
  const periodExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getMonth() + 1 === Number(selectedMonth) &&
      d.getFullYear() === Number(selectedYear)
    );
  });

  const totalBudgetLimit = filteredBudgets.reduce(
    (sum, b) => sum + (Number(b.limit) || 0),
    0
  );

  const totalPeriodSpent = periodExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
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
          <h1 className="page-title">Budgets & Limits</h1>
          <p className="page-subtitle">
            Set spending boundaries per category and receive alert triggers.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            + Create Budget
          </button>
        </div>
      </div>

      {/* Filter and Period Selection */}
      <div className="card filter-card">
        <div className="filter-grid budget-period-grid">
          <div className="filter-item">
            <label className="filter-label">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="filter-stat-box">
            <span>Period Total Budget:</span>
            <strong>{formatCurrency(totalBudgetLimit, currency)}</strong>
          </div>

          <div className="filter-stat-box">
            <span>Period Total Spent:</span>
            <strong style={{ color: totalPeriodSpent > totalBudgetLimit && totalBudgetLimit > 0 ? "#ef4444" : "inherit" }}>
              {formatCurrency(totalPeriodSpent, currency)}
            </strong>
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating budgets and tracking limits...</p>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p className="empty-title">
              No budgets found for {MONTHS.find((m) => m.value === Number(selectedMonth))?.label} {selectedYear}
            </p>
            <p className="empty-desc">
              Create a budget to monitor category expenditures and prevent overspending.
            </p>
            <button className="btn btn-primary" onClick={openAddModal}>
              + Set First Budget
            </button>
          </div>
        </div>
      ) : (
        <div className="budget-cards-grid">
          {filteredBudgets.map((item) => {
            const spent = periodExpenses
              .filter(
                (e) =>
                  !item.category ||
                  item.category === "All" ||
                  e.category === item.category
              )
              .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

            const percentage = item.limit > 0 ? (spent / item.limit) * 100 : 0;
            const remaining = item.limit - spent;
            const threshold = item.alertPercentage || 80;
            const isExceeded = spent > item.limit;
            const isAlert = percentage >= threshold && !isExceeded;

            let statusClass = "good";
            let statusText = "On Track";
            if (isExceeded) {
              statusClass = "danger";
              statusText = "Exceeded!";
            } else if (isAlert) {
              statusClass = "warning";
              statusText = `Alert (${threshold}%+)`;
            }

            return (
              <div key={item.id || item._id} className={`card budget-card ${statusClass}`}>
                <div className="budget-card-header">
                  <div>
                    <h3 className="budget-category-title">
                      {item.category || "All Categories"}
                    </h3>
                    <span className="budget-period-badge">
                      {MONTHS.find((m) => m.value === Number(item.month))?.label}{" "}
                      {item.year}
                    </span>
                  </div>
                  <span className={`status-pill ${statusClass}`}>{statusText}</span>
                </div>

                <div className="budget-amounts-row">
                  <div>
                    <small>Spent</small>
                    <div className="amount-num spent-num">
                      {formatCurrency(spent, currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <small>Limit</small>
                    <div className="amount-num limit-num">
                      {formatCurrency(item.limit, currency)}
                    </div>
                  </div>
                </div>

                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill ${
                      isExceeded
                        ? "fill-danger"
                        : isAlert
                        ? "fill-warning"
                        : "fill-primary"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>

                <div className="budget-card-footer">
                  <span>
                    {remaining >= 0 ? (
                      <>
                        Remaining: <strong>{formatCurrency(remaining, currency)}</strong>
                      </>
                    ) : (
                      <span className="text-danger">
                        Over by: <strong>{formatCurrency(Math.abs(remaining), currency)}</strong>
                      </span>
                    )}
                  </span>
                  <span>{percentage.toFixed(0)}% used</span>
                </div>

                <div className="budget-card-actions">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => openEditModal(item)}
                  >
                    ✎ Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger-ghost"
                    onClick={() => handleDelete(item.id)}
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Budget Limit" : "Create Budget Limit"}
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group-row">
            <div className="form-group">
              <label>Month *</label>
              <select
                value={formData.month}
                onChange={(e) =>
                  setFormData({ ...formData, month: Number(e.target.value) })
                }
                required
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Year *</label>
              <select
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: Number(e.target.value) })
                }
                required
              >
                {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

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
            <label>Spending Limit ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 5000"
              value={formData.limit}
              onChange={(e) =>
                setFormData({ ...formData, limit: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Alert Threshold Percentage (%)</label>
            <input
              type="number"
              min="10"
              max="100"
              placeholder="80"
              value={formData.alertPercentage}
              onChange={(e) =>
                setFormData({ ...formData, alertPercentage: e.target.value })
              }
            />
            <small className="form-hint">
              Warn you when spending reaches this % of the budget (Default: 80%)
            </small>
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
              {isEditing ? "Update Budget" : "Save Budget"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
