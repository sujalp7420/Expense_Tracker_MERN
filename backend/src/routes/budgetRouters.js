const express = require("express");
const protect = require("../../middleware/authMiddleware");

const {
    createBudget,
    getBudgets,
    getBudgetById,
    updateBudget,
    deleteBudget
} = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);
router.post("/", createBudget);
router.get("/", getBudgets);
router.get("/:id", getBudgetById);
router.patch("/:id", updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
