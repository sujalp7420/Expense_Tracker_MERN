import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import reportService from "../services/reportService";
import expenseService from "../services/expenseService";
import incomeService from "../services/incomeService";
import Toast from "../components/Toast";
import {
  formatCurrency,
  MONTHS,
} from "../utils/formatters";

export const Reports = () => {
  const { currency } = useAuth();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Tab: 'overview' | 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState("overview");

  // Selection
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportYear, setReportYear] = useState(currentYear);

  // Analytics & Raw Data
  const [analytics, setAnalytics] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
    totalBudget: 0,
    savingsPercentage: 0,
  });

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [exporting, setExporting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, expRes, incRes] = await Promise.all([
        reportService.getAnalytics().catch(() => ({ data: null })),
        expenseService.getAll().catch(() => ({ data: [] })),
        incomeService.getAll().catch(() => ({ data: [] })),
      ]);

      const expList = Array.isArray(expRes.data) ? expRes.data : [];
      const incList = Array.isArray(incRes.data) ? incRes.data : [];

      setExpenses(expList);
      setIncomes(incList);

      if (analyticsRes?.data) {
        setAnalytics(analyticsRes.data);
      } else {
        const totalInc = incList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalExp = expList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const savings = totalInc - totalExp;
        const rate = totalInc > 0 ? Number(((savings / totalInc) * 100).toFixed(2)) : 0;
        setAnalytics({
          totalIncome: totalInc,
          totalExpense: totalExp,
          totalSavings: savings,
          savingsPercentage: rate,
        });
      }
    } catch (err) {
      showToast(err.message || "Failed to load report analytics", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPeriodReports = useCallback(async () => {
    try {
      if (activeTab === "monthly") {
        const res = await reportService.getMonthly(reportMonth, reportYear);
        setSavedReports(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === "yearly") {
        const res = await reportService.getYearly(reportYear);
        setSavedReports(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn("Could not fetch saved reports:", err);
    }
  }, [activeTab, reportMonth, reportYear]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (activeTab !== "overview") {
      loadPeriodReports();
    }
  }, [activeTab, loadPeriodReports]);

  const handleExportCSV = () => {
  try {
    setExporting(true);

    const rows = [];

    // CSV header
    rows.push([
      "Type",
      "ID",
      "Category/Source",
      "Amount",
      "Method",
      "Date",
      "Description",
    ]);

    // Expenses
    expenses.forEach((e) => {
      rows.push([
        "Expense",
        e.id || e._id || "",
        e.category || "",
        e.amount || 0,
        e.paymentMethod || "",
        e.date || "",
        e.description || "",
      ]);
    });

    // Income
    incomes.forEach((i) => {
      rows.push([
        "Income",
        i.id || i._id || "",
        i.source || i.category || "",
        i.amount || 0,
        i.paymentMethod || "",
        i.date || "",
        i.description || "",
      ]);
    });

    // Convert data to CSV
    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    // Create downloadable file
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `financial_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    showToast("CSV report downloaded successfully!");
  } catch (error) {
    console.error("CSV export error:", error);
    showToast("Failed to export CSV", "error");
  } finally {
    setExporting(false);
  }
};

  const handleGenerateReportRecord = async () => {
    try {
      const filteredExp = expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          d.getMonth() + 1 === Number(reportMonth) &&
          d.getFullYear() === Number(reportYear)
        );
      });
      const filteredInc = incomes.filter((i) => {
        const d = new Date(i.date);
        return (
          d.getMonth() + 1 === Number(reportMonth) &&
          d.getFullYear() === Number(reportYear)
        );
      });

      const totalExp = filteredExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const totalInc = filteredInc.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const totalSav = totalInc - totalExp;

      await reportService.createReport({
        reportType: activeTab === "yearly" ? "Yearly" : "Monthly",
        month: activeTab === "yearly" ? undefined : Number(reportMonth),
        year: Number(reportYear),
        totalIncome: totalInc,
        totalExpense: totalExp,
        totalSavings: totalSav,
        fileName: `report-${reportYear}-${reportMonth}`,
      });

      showToast("Report saved to database!");
      loadPeriodReports();
    } catch (err) {
      showToast(err.message || "Failed to save report record", "error");
    }
  };

  // Compute category breakdown for expenses
  const categoryMap = {};
  expenses.forEach((e) => {
    const cat = e.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(e.amount) || 0);
  });

  const categoryEntries = Object.entries(categoryMap)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      pct: analytics.totalExpense > 0 ? (amount / analytics.totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Filtered by selected month / year for detailed period breakdown
  const monthlyFilteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    if (activeTab === "yearly") {
      return d.getFullYear() === Number(reportYear);
    }
    return (
      d.getMonth() + 1 === Number(reportMonth) &&
      d.getFullYear() === Number(reportYear)
    );
  });

  const monthlyFilteredIncome = incomes.filter((i) => {
    const d = new Date(i.date);
    if (activeTab === "yearly") {
      return d.getFullYear() === Number(reportYear);
    }
    return (
      d.getMonth() + 1 === Number(reportMonth) &&
      d.getFullYear() === Number(reportYear)
    );
  });

  const periodTotalExp = monthlyFilteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const periodTotalInc = monthlyFilteredIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const periodSavings = periodTotalInc - periodTotalExp;
  const periodSavingsPct = periodTotalInc > 0 ? Number(((periodSavings / periodTotalInc) * 100).toFixed(2)) : 0;

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
          <h1 className="page-title">Analytics & Financial Reports</h1>
          <p className="page-subtitle">
            Comprehensive breakdown of your revenue, spending, and savings velocity.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "⬇ Download CSV Report"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overall Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "monthly" ? "active" : ""}`}
          onClick={() => setActiveTab("monthly")}
        >
          Monthly Report
        </button>
        <button
          className={`tab-btn ${activeTab === "yearly" ? "active" : ""}`}
          onClick={() => setActiveTab("yearly")}
        >
          Yearly Report
        </button>
      </div>

      {/* Period Filter for Monthly/Yearly */}
      {activeTab !== "overview" && (
        <div className="card filter-card">
          <div className="filter-grid report-picker-grid">
            {activeTab === "monthly" && (
              <div className="filter-item">
                <label className="filter-label">Report Month</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-item">
              <label className="filter-label">Report Year</label>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-action-box">
              <button className="btn btn-outline" onClick={handleGenerateReportRecord}>
                + Save Snapshot to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing financial records...</p>
        </div>
      ) : (
        <>
          {/* Main KPI Stats */}
          <div className="stats-grid">
            <div className="stat-card stat-income">
              <div className="stat-card-header">
                <span className="stat-title">
                  {activeTab === "overview" ? "All-Time Income" : "Period Income"}
                </span>
                <span className="stat-icon-badge badge-green">↑</span>
              </div>
              <div className="stat-value">
                {formatCurrency(
                  activeTab === "overview" ? analytics.totalIncome : periodTotalInc,
                  currency
                )}
              </div>
            </div>

            <div className="stat-card stat-expense">
              <div className="stat-card-header">
                <span className="stat-title">
                  {activeTab === "overview" ? "All-Time Expenses" : "Period Expenses"}
                </span>
                <span className="stat-icon-badge badge-red">↓</span>
              </div>
              <div className="stat-value">
                {formatCurrency(
                  activeTab === "overview" ? analytics.totalExpense : periodTotalExp,
                  currency
                )}
              </div>
            </div>

            <div className="stat-card stat-savings">
              <div className="stat-card-header">
                <span className="stat-title">
                  {activeTab === "overview" ? "Net Savings" : "Period Savings"}
                </span>
                <span className="stat-icon-badge badge-blue">★</span>
              </div>
              <div
                className="stat-value"
                style={{
                  color:
                    (activeTab === "overview" ? analytics.totalSavings : periodSavings) >= 0
                      ? "#10b981"
                      : "#ef4444",
                }}
              >
                {formatCurrency(
                  activeTab === "overview" ? analytics.totalSavings : periodSavings,
                  currency
                )}
              </div>
            </div>

            <div className="stat-card stat-budget">
              <div className="stat-card-header">
                <span className="stat-title">Savings Rate</span>
                <span className="stat-icon-badge badge-purple">%</span>
              </div>
              <div className="stat-value">
                {activeTab === "overview" ? analytics.savingsPercentage : periodSavingsPct}%
              </div>
            </div>
          </div>

          {/* Category Spending Breakdown */}
          <div className="dashboard-columns">
            <div className="card dashboard-card flex-2">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Expense Distribution by Category</h2>
                  <p className="card-subtitle">Where most of your capital is directed</p>
                </div>
              </div>

              {categoryEntries.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">No spending data to break down</p>
                </div>
              ) : (
                <div className="category-breakdown-list">
                  {categoryEntries.map((cat, idx) => (
                    <div key={idx} className="category-progress-item">
                      <div className="cat-item-info">
                        <span className="cat-name font-medium">{cat.category}</span>
                        <span className="cat-amt">
                          {formatCurrency(cat.amount, currency)} ({cat.pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill fill-accent"
                          style={{ width: `${Math.min(cat.pct, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved DB Snapshots or Insights */}
            <div className="card dashboard-card flex-1">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Snapshot Records</h2>
                  <p className="card-subtitle">Saved snapshots in database</p>
                </div>
              </div>

              {savedReports.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-desc">
                    No database report snapshots saved for this period. Click "+ Save Snapshot to Database" above to store permanent ledger snapshots.
                  </p>
                </div>
              ) : (
                <div className="saved-reports-list">
                  {savedReports.map((rpt, idx) => (
                    <div key={rpt.id || idx} className="saved-report-row">
                      <div>
                        <strong>{rpt.reportType} Report #{rpt.id}</strong>
                        <div className="cell-subtext">
                          {rpt.month ? `${MONTHS.find((m) => m.value === rpt.month)?.label} ` : ""}
                          {rpt.year}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="amount-income">+{formatCurrency(rpt.totalIncome, currency)}</div>
                        <div className="amount-expense">-{formatCurrency(rpt.totalExpense, currency)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
