const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_reports";

const User = require("../src/models/user");
const Expense = require("../src/models/expense");
const Income = require("../src/models/income");
const Budget = require("../src/models/budget");
const Report = require("../src/models/reports");

const userId = new mongoose.Types.ObjectId();
const user = {
    _id: userId,
    userId: 99,
    name: "Analytics Tester",
    email: "analytics@example.com",
    password: "password123",
    currency: "INR"
};

const db = {
    expenses: [
        { id: 1, user: userId, amount: 1500, category: "Food & Dining", paymentMethod: "UPI", date: new Date("2026-09-05") },
        { id: 2, user: userId, amount: 500, category: "Transportation", paymentMethod: "Card", date: new Date("2026-09-10") },
        { id: 3, user: userId, amount: 3000, category: "Housing & Rent", paymentMethod: "Bank Transfer", date: new Date("2026-08-01") }
    ],
    incomes: [
        { id: 1, user: userId, amount: 25000, source: "Primary Job", category: "Salary", paymentMethod: "Bank Transfer", date: new Date("2026-09-01") },
        { id: 2, user: userId, amount: 5000, source: "Freelance", category: "Freelance & Contract", paymentMethod: "UPI", date: new Date("2026-09-15") }
    ],
    budgets: [
        { id: 1, user: userId, month: 9, year: 2026, category: "Food & Dining", limit: 3000, alertPercentage: 80 },
        { id: 2, user: userId, month: 9, year: 2026, category: "Transportation", limit: 1000, alertPercentage: 80 }
    ],
    reports: []
};

let nextReportId = 1;

const chain = (value) => ({
    select: async () => value,
    populate: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    catch: (reject) => Promise.resolve(value).catch(reject)
});

const sameUser = (query) => String(query.user) === String(user._id);

User.findById = () => chain(user);
Income.find = (query) => chain(db.incomes.filter((x) => sameUser({ user: x.user })));
Expense.find = (query) => chain(db.expenses.filter((x) => sameUser({ user: x.user })));
Budget.find = (query) => chain(db.budgets.filter((x) => sameUser({ user: x.user })));
Report.find = (query) => chain(db.reports.filter((x) => sameUser({ user: x.user }) && (!query.reportType || x.reportType === query.reportType) && (!query.month || x.month === query.month) && (!query.year || x.year === query.year)));
Report.create = async (data) => {
    const item = {
        _id: new mongoose.Types.ObjectId(),
        id: nextReportId++,
        ...data
    };
    db.reports.push(item);
    return item;
};

const app = require("../src/app");

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
            resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
});

(async () => {
    const server = app.listen(0);
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);
    const results = [];

    const test = async (name, fn) => {
        try {
            await fn();
            results.push({ name, pass: true });
            console.log(`✓ PASS: ${name}`);
        } catch (err) {
            results.push({ name, pass: false, error: err.message });
            console.error(`✗ FAIL: ${name} -> ${err.message}`);
        }
    };

    try {
        console.log("\n--- STARTING ANALYTICS & REPORTS TEST SUITE ---\n");

        await test("Analytics returns correct financial aggregations", async () => {
            const res = await request(server, "GET", "/api/reports/analytics", undefined, token);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            const data = res.body.data;
            if (data.totalIncome !== 30000) throw new Error(`Expected totalIncome 30000, got ${data.totalIncome}`);
            if (data.totalExpense !== 5000) throw new Error(`Expected totalExpense 5000, got ${data.totalExpense}`);
            if (data.totalSavings !== 25000) throw new Error(`Expected totalSavings 25000, got ${data.totalSavings}`);
            if (data.totalBudget !== 4000) throw new Error(`Expected totalBudget 4000, got ${data.totalBudget}`);
            if (data.savingsPercentage !== 83.33) throw new Error(`Expected savingsPercentage 83.33, got ${data.savingsPercentage}`);
        });

        await test("Create Monthly Report Snapshot", async () => {
            const payload = {
                reportType: "Monthly",
                month: 9,
                year: 2026,
                totalIncome: 30000,
                totalExpense: 2000,
                totalSavings: 28000
            };
            const res = await request(server, "POST", "/api/reports/create", payload, token);
            if (res.status !== 201) throw new Error(`Status ${res.status} - ${res.body.message}`);
            if (!res.body.data?.id) throw new Error("Report ID not returned");
            if (res.body.data.totalSavings !== 28000) throw new Error("Incorrect total savings in created report");
        });

        await test("Get Monthly Report for September 2026", async () => {
            const res = await request(server, "GET", "/api/reports/monthly?month=9&year=2026", undefined, token);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error("Expected monthly reports array");
            if (res.body.data[0].month !== 9) throw new Error("Incorrect month in report");
        });

        await test("Monthly Report fails validation without month/year query params", async () => {
            const res = await request(server, "GET", "/api/reports/monthly", undefined, token);
            if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
        });

        await test("Create Yearly Report Snapshot", async () => {
            const payload = {
                reportType: "Yearly",
                year: 2026,
                totalIncome: 360000,
                totalExpense: 60000,
                totalSavings: 300000
            };
            const res = await request(server, "POST", "/api/reports/create", payload, token);
            if (res.status !== 201) throw new Error(`Status ${res.status}`);
        });

        await test("Get Yearly Report for 2026", async () => {
            const res = await request(server, "GET", "/api/reports/yearly?year=2026", undefined, token);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error("Expected yearly reports array");
        });

        await test("Get Overall Report Aggregations", async () => {
            const res = await request(server, "GET", "/api/reports/overall", undefined, token);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            const data = res.body.data;
            if (data.totalIncome !== 390000) throw new Error(`Expected 390000, got ${data.totalIncome}`);
            if (data.totalExpense !== 62000) throw new Error(`Expected 62000, got ${data.totalExpense}`);
            if (data.totalSavings !== 328000) throw new Error(`Expected 328000, got ${data.totalSavings}`);
        });

        await test("Export PDF Report data", async () => {
            const res = await request(server, "GET", "/api/reports/export/pdf", undefined, token);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!Array.isArray(res.body.data)) throw new Error("Expected report array in PDF export");
        });

        await test("Export CSV file download stream", async () => {
            const res = await request(server, "GET", "/api/reports/export/csv", undefined, token);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!res.headers["content-type"] || !res.headers["content-type"].includes("text/csv")) {
                throw new Error("Expected text/csv Content-Type header");
            }
            if (typeof res.body !== "string" || !res.body.includes("Report ID,Report Type")) {
                throw new Error("Expected CSV text with header row");
            }
        });

        const failed = results.filter(r => !r.pass);
        console.log(`\n========================================`);
        console.log(`ANALYTICS & REPORTS: ${results.length - failed.length}/${results.length} PASSED`);
        console.log(`========================================\n`);

        if (failed.length > 0) process.exitCode = 1;
    } finally {
        server.close();
    }
})();
