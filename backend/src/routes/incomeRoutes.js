const express = require("express");
const protect = require("../../middleware/authMiddleware");

const {
    createIncome,
    getIncome,
    deleteIncome,
    updateIncome,
    getIncomeById,
    updateWholeIncome
} = require("../controllers/incomeController");

const router = express.Router();

router.use(protect);
router.post("/", createIncome);
router.get("/", getIncome);
router.get("/:id", getIncomeById);
router.delete("/:id", deleteIncome);
router.patch("/:id", updateIncome);
router.put("/:id", updateWholeIncome);

module.exports = router;
