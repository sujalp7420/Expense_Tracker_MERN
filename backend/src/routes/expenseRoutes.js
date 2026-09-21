const express = require("express");
const protect = require("../../middleware/authMiddleware");

const {
    createExpense,
    getExpense,
    getExpenseById,
    deleteExpense,
    updateExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.use(protect);
router.post("/", createExpense);
router.get("/", getExpense);
router.get("/:id", getExpenseById);
router.delete("/:id", deleteExpense);
router.patch("/:id", updateExpense);

module.exports = router;
