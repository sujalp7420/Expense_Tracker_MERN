const Report = require("../models/reports");
const Income = require("../models/income");
const Expense = require("../models/expense");
const Budget = require("../models/budget");

const createReport = async (req, res) => {
    try {

        const {
            budgets,
            expenses,
            reportType,
            month,
            year,
            startDate,
            endDate,
            totalIncome,
            totalExpense,
            totalSavings,
            fileType,
            fileName,
            filePath
        } = req.body;


        const report = await Report.create({

            // User relationship
            user: req.user._id,

            // Budget relationship
            budgets: budgets || [],

            // Expense relationship
            expenses: expenses || [],

            reportType,
            month,
            year,
            startDate,
            endDate,

            totalIncome: totalIncome || 0,
            totalExpense: totalExpense || 0,
            totalSavings: totalSavings || 0,

            fileType: fileType || "CSV",
            fileName: fileName || `report-${year}-${month || "all"}.csv`,
            filePath
        });


        res.status(201).json({
            success: true,
            message: "Report created successfully",
            data: report
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// MONTHLY REPORT
const getMonthlyReport = async (req, res) => {
    try {

        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Month and year are required"
            });
        }

        const report = await Report.find({
            user: req.user._id,
            reportType: "Monthly",
            month: Number(month),
            year: Number(year)
        });

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// YEARLY REPORT
const getYearlyReport = async (req, res) => {
    try {

        const { year } = req.query;

        if (!year) {
            return res.status(400).json({
                success: false,
                message: "Year is required"
            });
        }

        const report = await Report.find({
            user: req.user._id,
            reportType: "Yearly",
            year: Number(year)
        });

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// OVERALL REPORT
const getOverallReport = async (req, res) => {
    try {

        const reports = await Report.find({
            user: req.user._id
        });

        let totalIncome = 0;
        let totalExpense = 0;
        let totalSavings = 0;

        reports.forEach(report => {
            totalIncome += report.totalIncome || 0;
            totalExpense += report.totalExpense || 0;
            totalSavings += report.totalSavings || 0;
        });

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                totalSavings
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// ANALYTICS
const getAnalytics = async (req, res) => {
    try {

        const [incomeData, expenseData, budgetData] = await Promise.all([

            Income.find({
                user: req.user._id
            }),

            Expense.find({
                user: req.user._id
            }),

            Budget.find({
                user: req.user._id
            })

        ]);


        const totalIncome = incomeData.reduce(
            (sum, item) => sum + item.amount,
            0
        );

        const totalExpense = expenseData.reduce(
            (sum, item) => sum + item.amount,
            0
        );

        const totalBudget = budgetData.reduce(
            (sum, item) => sum + item.limit,
            0
        );

        const totalSavings = totalIncome - totalExpense;

        const savingsPercentage =
            totalIncome > 0
                ? Number(((totalSavings / totalIncome) * 100).toFixed(2))
                : 0;


        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                totalSavings,
                totalBudget,
                savingsPercentage
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// EXPORT PDF DATA
const exportPDF = async (req, res) => {
    try {

        const reports = await Report.find({
            user: req.user._id
        });

        res.status(200).json({
            success: true,
            message: "PDF report data generated successfully",
            data: reports
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// EXPORT CSV
const exportCSV = async (req, res) => {
    try {

        const reports = await Report.find({
            user: req.user._id
        });

        let csv =
            "Report ID,Report Type,Month,Year,Total Income,Total Expense,Total Savings\n";

        reports.forEach(report => {

            csv += `${report.id},`;
            csv += `${report.reportType},`;
            csv += `${report.month || ""},`;
            csv += `${report.year},`;
            csv += `${report.totalIncome},`;
            csv += `${report.totalExpense},`;
            csv += `${report.totalSavings}\n`;

        });

        res.header("Content-Type", "text/csv");

        res.attachment("report.csv");

        res.send(csv);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


module.exports = {
    getMonthlyReport,
    getYearlyReport,
    getOverallReport,
    exportPDF,
    exportCSV,
    getAnalytics,
    createReport
};

// const Report = require("../models/reports");

// const getMonthlyReport = async (req, res) => {
//     try {
//         const { month, year } = req.query;

//         if (!month || !year) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Month and year are required"
//             });
//         }

//         const report = await Report.find({
//             reportType: "Monthly",
//             month: Number(month),
//             year: Number(year)
//         });

//         res.status(200).json({
//             success: true,
//             data: report
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// const getYearlyReport = async (req, res) => {
//     try {
//         const { year } = req.query;

//         if (!year) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Year is required"
//             });
//         }

//         const report = await Report.find({
//             reportType: "Yearly",
//             year: Number(year)
//         });

//         res.status(200).json({
//             success: true,
//             data: report
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// const getOverallReport = async (req, res) => {
//     try {

//         const reports = await Report.find();

//         let totalIncome = 0;
//         let totalExpense = 0;
//         let totalSavings = 0;

//         reports.forEach(report => {
//             totalIncome += report.totalIncome || 0;
//             totalExpense += report.totalExpense || 0;
//             totalSavings += report.totalSavings || 0;
//         });

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalIncome,
//                 totalExpense,
//                 totalSavings
//             }
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// const exportPDF = async (req, res) => {
//     try {

//         const reports = await Report.find();

//         // For now return report data.
//         // PDF generation can be added using PDFKit.
//         res.status(200).json({
//             success: true,
//             message: "PDF report data generated successfully",
//             data: reports
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// const exportCSV = async (req, res) => {
//     try {

//         const reports = await Report.find();

//         let csv = "Report ID,Report Type,Month,Year,Total Income,Total Expense,Total Savings\n";

//         reports.forEach(report => {

//             csv += `${report.id},`;
//             csv += `${report.reportType},`;
//             csv += `${report.month || ""},`;
//             csv += `${report.year},`;
//             csv += `${report.totalIncome},`;
//             csv += `${report.totalExpense},`;
//             csv += `${report.totalSavings}\n`;

//         });

//         res.header("Content-Type", "text/csv");

//         res.attachment("report.csv");

//         res.send(csv);

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// const getAnalytics = async (req, res) => {
//     try {

//         const reports = await Report.find();

//         let totalIncome = 0;
//         let totalExpense = 0;
//         let totalSavings = 0;

//         reports.forEach(report => {

//             totalIncome += report.totalIncome || 0;
//             totalExpense += report.totalExpense || 0;
//             totalSavings += report.totalSavings || 0;

//         });

//         const savingsPercentage =
//             totalIncome > 0
//                 ? ((totalSavings / totalIncome) * 100).toFixed(2)
//                 : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalIncome,
//                 totalExpense,
//                 totalSavings,
//                 savingsPercentage: Number(savingsPercentage)
//             }
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// module.exports = {
//     getMonthlyReport,
//     getYearlyReport,
//     getOverallReport,
//     exportPDF,
//     exportCSV,
//     getAnalytics
// };