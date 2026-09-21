const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

const User = require("./src/models/user");
const Expense = require("./src/models/expense");
const Income = require("./src/models/income");
const Budget = require("./src/models/budget");
const Report = require("./src/models/reports");

const userId = new mongoose.Types.ObjectId();
const user = {
    _id: userId,
    userId: 1,
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    currency: "INR"
};

const db = {
    expenses: [],
    incomes: [],
    budgets: [],
    reports: []
};

let nextExpenseId = 1;
let nextIncomeId = 1;
let nextBudgetId = 1;
let nextReportId = 1;

const chain = (value) => ({
    select: async () => value,
    populate: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    catch: (reject) => Promise.resolve(value).catch(reject)
});

const sameUser = (query) => String(query.user) === String(user._id);

User.findOne = async (query) => {
    if (query.email && query.email === user.email) return user;
    if (query.userId && query.userId === user.userId) return user;
    return null;
};
User.findById = () => chain(user);
User.findOneAndUpdate = () => chain({ ...user });
User.findOneAndDelete = async () => user;

const makeModel = (name, store) => {
    const create = async (data) => {
        const item = {
            _id: new mongoose.Types.ObjectId(),
            id: name === "Expense" ? nextExpenseId++ : name === "Income" ? nextIncomeId++ : name === "Budget" ? nextBudgetId++ : nextReportId++,
            ...data
        };
        store.push(item);
        return item;
    };

    const find = (query) => chain(store.filter((item) => !query.user || sameUser({ user: item.user })));
    const findOne = (query) => {
        const item = store.find((x) => x.id === query.id && sameUser({ user: x.user }));
        return chain(item || null);
    };
    const findOneAndDelete = async (query) => {
        const index = store.findIndex((x) => x.id === query.id && sameUser({ user: x.user }));
        if (index < 0) return null;
        return store.splice(index, 1)[0];
    };
    const findOneAndUpdate = async (query, update) => {
        const item = store.find((x) => x.id === query.id && sameUser({ user: x.user }));
        if (!item) return null;
        Object.assign(item, update.$set || {});
        return item;
    };
    const findOneAndReplace = async (query, replacement) => {
        const item = store.find((x) => x.id === query.id && sameUser({ user: x.user }));
        if (!item) return null;
        Object.assign(item, replacement);
        return item;
    };

    return { create, find, findOne, findOneAndDelete, findOneAndUpdate, findOneAndReplace };
};

Object.assign(Expense, makeModel("Expense", db.expenses));
Object.assign(Income, makeModel("Income", db.incomes));
Object.assign(Budget, makeModel("Budget", db.budgets));
Object.assign(Report, makeModel("Report", db.reports));

// Report controller uses Promise.all/find and aggregate-like calculations only.
Report.find = (query) => chain(db.reports.filter((x) => sameUser({ user: x.user }) && (!query.reportType || x.reportType === query.reportType) && (!query.month || x.month === query.month) && (!query.year || x.year === query.year)));
Income.find = (query) => chain(db.incomes.filter((x) => sameUser({ user: x.user })));
Expense.find = (query) => chain(db.expenses.filter((x) => sameUser({ user: x.user })));
Budget.find = (query) => chain(db.budgets.filter((x) => sameUser({ user: x.user })));

const app = require("./src/app");

const request = (server, method, path, body, token) => new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
        port: server.address().port,
        host: "127.0.0.1",
        method,
        path,
        headers: {
            ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    }, (res) => {
        let raw = "";
        res.on("data", chunk => raw += chunk);
        res.on("end", () => {
            let parsed = raw;
            try { parsed = JSON.parse(raw); } catch (_) {}
            resolve({ status: res.statusCode, body: parsed });
        });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
});

(async () => {
    const server = app.listen(0);
    const results = [];

    const check = async (name, method, path, body, expected, token) => {
        const result = await request(server, method, path, body, token);
        const ok = result.status === expected;
        results.push({ name, expected, actual: result.status, ok, message: result.body?.message });
        if (!ok) console.error("FAIL", name, result);
        return result;
    };

    try {
        await check("Health", "GET", "/api/health", undefined, 200);
        await check("Login missing fields", "POST", "/api/users/login", {}, 400);

        const login = await check("Login success", "POST", "/api/users/login", {
            email: user.email,
            password: user.password
        }, 200);
        const token = login.body.data.token;

        const expectedTokenUser = jwt.verify(token, process.env.JWT_SECRET);
        if (expectedTokenUser.id !== String(user._id)) throw new Error("JWT does not contain MongoDB user _id");

        await check("Profile without token", "GET", "/api/users/profile", undefined, 401);
        await check("Profile", "GET", "/api/users/profile", undefined, 200, token);

        const expense = await check("Create expense", "POST", "/api/expenses", {
            amount: 500,
            category: "Food",
            paymentMethod: "UPI",
            description: "Lunch"
        }, 201, token);
        const expenseId = expense.body.data.id;
        await check("Get expenses", "GET", "/api/expenses", undefined, 200, token);
        await check("Get expense by id", "GET", `/api/expenses/${expenseId}`, undefined, 200, token);
        await check("Update expense", "PATCH", `/api/expenses/${expenseId}`, { amount: 600 }, 200, token);
        await check("Delete expense", "DELETE", `/api/expenses/${expenseId}`, undefined, 200, token);

        const income = await check("Create income", "POST", "/api/income", {
            amount: 5000,
            source: "Salary",
            category: "Job",
            paymentMethod: "Bank Transfer"
        }, 201, token);
        const incomeId = income.body.data.id;
        await check("Get incomes", "GET", "/api/income", undefined, 200, token);
        await check("Get income by id", "GET", `/api/income/${incomeId}`, undefined, 200, token);
        await check("Patch income", "PATCH", `/api/income/${incomeId}`, { amount: 5500 }, 200, token);
        await check("Put income", "PUT", `/api/income/${incomeId}`, {
            amount: 6000,
            source: "Salary",
            category: "Job",
            paymentMethod: "Bank Transfer"
        }, 200, token);
        await check("Delete income", "DELETE", `/api/income/${incomeId}`, undefined, 200, token);

        const budget = await check("Create budget", "POST", "/api/budgets", {
            month: 8,
            year: 2026,
            category: "Food",
            limit: 10000,
            alertPercentage: 80
        }, 201, token);
        const budgetId = budget.body.data.id;
        await check("Get budgets", "GET", "/api/budgets", undefined, 200, token);
        await check("Get budget by id", "GET", `/api/budgets/${budgetId}`, undefined, 200, token);
        await check("Update budget", "PATCH", `/api/budgets/${budgetId}`, { limit: 12000 }, 200, token);
        await check("Delete budget", "DELETE", `/api/budgets/${budgetId}`, undefined, 200, token);

        await check("Monthly report missing params", "GET", "/api/reports/monthly", undefined, 400, token);
        await check("Monthly report", "GET", "/api/reports/monthly?month=8&year=2026", undefined, 200, token);
        await check("Yearly report", "GET", "/api/reports/yearly?year=2026", undefined, 200, token);
        await check("Overall report", "GET", "/api/reports/overall", undefined, 200, token);
        await check("Create report", "POST", "/api/reports/create", {
            reportType: "Monthly",
            month: 8,
            year: 2026,
            totalIncome: 5000,
            totalExpense: 1000,
            totalSavings: 4000,
            fileType: "CSV",
            fileName: "august-2026.csv"
        }, 201, token);
        await check("Analytics", "GET", "/api/reports/analytics", undefined, 200, token);
        await check("PDF export", "GET", "/api/reports/export/pdf", undefined, 200, token);
        await check("CSV export", "GET", "/api/reports/export/csv", undefined, 200, token);

        console.log("\nAPI MOCK TEST RESULTS");
        for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}: ${r.actual}`);
        const failed = results.filter(r => !r.ok);
        console.log(`\nPassed: ${results.length - failed.length}/${results.length}`);
        if (failed.length) process.exitCode = 1;
    } finally {
        server.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
