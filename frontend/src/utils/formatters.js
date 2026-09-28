export const formatCurrency = (amount, currency = "INR") => {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing & Rent",
  "Utilities & Bills",
  "Groceries",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Education",
  "Travel",
  "Personal Care",
  "Investment",
  "Others",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance & Contract",
  "Business & Sales",
  "Investments & Dividends",
  "Rental Income",
  "Gifts & Grants",
  "Refunds",
  "Others",
];

export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Card",
  "Bank Transfer",
  "Other",
];

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
