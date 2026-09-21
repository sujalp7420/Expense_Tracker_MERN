const express = require("express");
const protect = require("../../middleware/authMiddleware");

const {
    exportPDF,
    exportCSV,
    getMonthlyReport,
    getYearlyReport,
    getOverallReport,
    getAnalytics,
    createReport
} = require("../controllers/reportConroller");

const router = express.Router();

router.use(protect);
router.get("/monthly", getMonthlyReport);
router.get("/yearly", getYearlyReport);
router.get("/overall", getOverallReport);
router.get("/export/pdf", exportPDF);
router.get("/export/csv", exportCSV);
router.get("/analytics", getAnalytics);
router.post("/create", createReport);

module.exports = router;
