import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import expenseService from "../services/expenseService";
import incomeService from "../services/incomeService";
import budgetService from "../services/budgetService";
import reportService from "../services/reportService";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import {
  formatCurrency,
  formatDate,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "../utils/formatters";

export const Dashboard = () => {
  const { user, currency } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
    totalBudget: 0,
    savingsPercentage: 0,
  });

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: EXPENSE_CATEGORIES[0],
    paymentMethod: PAYMENT_METHODS[0],
    date: new Date().toISOString().slice(0, 10),
    description: "",
    notes: "",
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    source: "",
    category: INCOME_CATEGORIES[0],
    paymentMethod: PAYMENT_METHODS[0],
    date: new Date().toISOString().slice(0, 10),
    description: "",
    notes: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, expRes, incRes, budRes] = await Promise.all([
        reportService.getAnalytics().catch(() => ({ data: null })),
        expenseService.getAll().catch(() => ({ data: [] })),
        incomeService.getAll().catch(() => ({ data: [] })),
        budgetService.getAll().catch(() => ({ data: [] })),
      ]);

      const expList = Array.isArray(expRes.data) ? expRes.data : [];
      const incList = Array.isArray(incRes.data) ? incRes.data : [];
      const budList = Array.isArray(budRes.data) ? budRes.data : [];

      setExpenses(expList);
      setIncomes(incList);
      setBudgets(budList);

      if (analyticsRes?.data) {
        setStats(analyticsRes.data);
      } else {
        const totalInc = incList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalExp = expList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalBud = budList.reduce((acc, curr) => acc + (Number(curr.limit) || 0), 0);
        const savings = totalInc - totalExp;
        const rate = totalInc > 0 ? Number(((savings / totalInc) * 100).toFixed(2)) : 0;
        setStats({
          totalIncome: totalInc,
          totalExpense: totalExp,
          totalSavings: savings,
          totalBudget: totalBud,
          savingsPercentage: rate,
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      showToast("Error loading dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseService.create({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });
      showToast("Expense recorded successfully!");
      setExpenseModalOpen(false);
      setExpenseForm({
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        paymentMethod: PAYMENT_METHODS[0],
        date: new Date().toISOString().slice(0, 10),
        description: "",
        notes: "",
      });
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to record expense", "error");
    }
  };

  const handleCreateIncome = async (e) => {
    e.preventDefault();
    try {
      await incomeService.create({
        ...incomeForm,
        amount: Number(incomeForm.amount),
      });
      showToast("Income added successfully!");
      setIncomeModalOpen(false);
      setIncomeForm({
        amount: "",
        source: "",
        category: INCOME_CATEGORIES[0],
        paymentMethod: PAYMENT_METHODS[0],
        date: new Date().toISOString().slice(0, 10),
        description: "",
        notes: "",
      });
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to add income", "error");
    }
  };

  // Combine and sort recent transactions
  const combinedTransactions = [
    ...expenses.map((e) => ({ ...e, txnType: "expense" })),
    ...incomes.map((i) => ({ ...i, txnType: "income" })),
  ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 8);

  // Calculate budget alerts
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const budgetAlerts = budgets.map((b) => {
    const spent = currentMonthExpenses
      .filter((e) => !b.category || b.category === "All" || e.category === b.category)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const threshold = b.alertPercentage || 80;
    return {
      ...b,
      spent,
      pct,
      isExceeded: spent > b.limit,
      isAlert: pct >= threshold,
    };
  });

  return (
    <div className="page-wrapper">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name}</strong>! Here is an overview of your money.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => setIncomeModalOpen(true)}
          >
            + Add Income
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setExpenseModalOpen(true)}
          >
            + Record Expense
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial insights...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="stats-grid">
            <div className="stat-card stat-income">
              <div className="stat-card-header">
                <span className="stat-title">Total Income</span>
                <span className="stat-icon-badge badge-green">↑</span>
              </div>
              <div className="stat-value">{formatCurrency(stats.totalIncome, currency)}</div>
              <div className="stat-hint">{incomes.length} recorded income entries</div>
            </div>

            <div className="stat-card stat-expense">
              <div className="stat-card-header">
                <span className="stat-title">Total Expenses</span>
                <span className="stat-icon-badge badge-red">↓</span>
              </div>
              <div className="stat-value">{formatCurrency(stats.totalExpense, currency)}</div>
              <div className="stat-hint">{expenses.length} recorded expense transactions</div>
            </div>

            <div className="stat-card stat-savings">
              <div className="stat-card-header">
                <span className="stat-title">Net Savings</span>
                <span className={`stat-icon-badge ${stats.totalSavings >= 0 ? "badge-blue" : "badge-red"}`}>
                  {stats.totalSavings >= 0 ? "★" : "!"}
                </span>
              </div>
              <div className="stat-value" style={{ color: stats.totalSavings >= 0 ? "#10b981" : "#ef4444" }}>
                {formatCurrency(stats.totalSavings, currency)}
              </div>
              <div className="stat-hint">
                Savings Rate: <strong>{stats.savingsPercentage}%</strong>
              </div>
            </div>

            <div className="stat-card stat-budget">
              <div className="stat-card-header">
                <span className="stat-title">Active Budgets</span>
                <span className="stat-icon-badge badge-purple">🎯</span>
              </div>
              <div className="stat-value">{formatCurrency(stats.totalBudget, currency)}</div>
              <div className="stat-hint">{budgets.length} configured budget limits</div>
            </div>
          </div>

          {/* Budget Health Indicators */}
          {budgetAlerts.length > 0 && (
            <div className="card dashboard-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Budget Health & Watchlist</h2>
                  <p className="card-subtitle">Monthly spending against your limits</p>
                </div>
                <Link to="/budgets" className="btn btn-sm btn-outline">
                  Manage Budgets →
                </Link>
              </div>

              <div className="budget-watchlist-grid">
                {budgetAlerts.slice(0, 3).map((b, idx) => (
                  <div key={b.id || idx} className={`budget-alert-item ${b.isExceeded ? "danger" : b.isAlert ? "warning" : "good"}`}>
                    <div className="budget-item-top">
                      <span className="budget-cat-name">{b.category || "Overall Limit"}</span>
                      <span className="budget-pct-tag">{b.pct.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill ${b.isExceeded ? "fill-danger" : b.isAlert ? "fill-warning" : "fill-primary"}`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }}
                      ></div>
                    </div>
                    <div className="budget-item-bottom">
                      <span>Spent: {formatCurrency(b.spent, currency)}</span>
                      <span>Limit: {formatCurrency(b.limit, currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main 2-column Section: Recent Transactions + Quick Actions */}
          <div className="dashboard-columns">
            <div className="card dashboard-card flex-2">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Recent Activity</h2>
                  <p className="card-subtitle">Latest income and expense records</p>
                </div>
                <div className="card-actions">
                  <Link to="/expenses" className="btn btn-sm btn-ghost">
                    All Expenses
                  </Link>
                  <Link to="/income" className="btn btn-sm btn-ghost">
                    All Income
                  </Link>
                </div>
              </div>

              {combinedTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💸</div>
                  <p className="empty-title">No transactions recorded yet</p>
                  <p className="empty-desc">Click '+ Record Expense' or '+ Add Income' to get started!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Category / Source</th>
                        <th>Method</th>
                        <th>Date</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedTransactions.map((txn, index) => {
                        const isExp = txn.txnType === "expense";
                        return (
                          <tr key={`${txn.txnType}-${txn.id || index}`}>
                            <td>
                              <span className={`pill-badge ${isExp ? "pill-expense" : "pill-income"}`}>
                                {isExp ? "Expense" : "Income"}
                              </span>
                            </td>
                            <td>
                              <strong>{isExp ? txn.category : txn.source || txn.category}</strong>
                              {txn.description && <div className="cell-subtext">{txn.description}</div>}
                            </td>
                            <td>{txn.paymentMethod || "—"}</td>
                            <td>{formatDate(txn.date)}</td>
                            <td className={`text-right font-medium ${isExp ? "amount-expense" : "amount-income"}`}>
                              {isExp ? "-" : "+"}
                              {formatCurrency(txn.amount, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card dashboard-card flex-1">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Quick Actions</h2>
                  <p className="card-subtitle">Frequently used tools</p>
                </div>
              </div>

              <div className="quick-actions-list">
                <button
                  className="quick-action-row"
                  onClick={() => setExpenseModalOpen(true)}
                >
                  <div className="action-row-icon bg-red-light">−</div>
                  <div className="action-row-text">
                    <strong>Record Expense</strong>
                    <small>Track money you just spent</small>
                  </div>
                  <span>→</span>
                </button>

                <button
                  className="quick-action-row"
                  onClick={() => setIncomeModalOpen(true)}
                >
                  <div className="action-row-icon bg-green-light">+</div>
                  <div className="action-row-text">
                    <strong>Add Income</strong>
                    <small>Record salary, dividend, or freelance</small>
                  </div>
                  <span>→</span>
                </button>

                <Link to="/budgets" className="quick-action-row">
                  <div className="action-row-icon bg-purple-light">🎯</div>
                  <div className="action-row-text">
                    <strong>Set Monthly Budget</strong>
                    <small>Prevent overspending in categories</small>
                  </div>
                  <span>→</span>
                </Link>

                <Link to="/reports" className="quick-action-row">
                  <div className="action-row-icon bg-blue-light">📊</div>
                  <div className="action-row-text">
                    <strong>View Reports & CSV</strong>
                    <small>Analyze breakdown and export sheets</small>
                  </div>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Record New Expense"
      >
        <form onSubmit={handleCreateExpense} className="form-stack">
          <div className="form-group">
            <label>Amount ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
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
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
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
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="e.g. Dinner with team, Grocery shopping"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="2"
              placeholder="Optional additional notes..."
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setExpenseModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        title="Add Income"
      >
        <form onSubmit={handleCreateIncome} className="form-stack">
          <div className="form-group">
            <label>Amount ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Source *</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corp Salary, Upwork Client"
              value={incomeForm.source}
              onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={incomeForm.category}
                onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
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
                value={incomeForm.paymentMethod}
                onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
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
              value={incomeForm.date}
              onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="e.g. Monthly salary, Quarterly dividend"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="2"
              placeholder="Optional notes..."
              value={incomeForm.notes}
              onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIncomeModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Income
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
