const Expense = require("../models/expense");

const getNumericId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const createExpense = async (req, res) => {
    try {
        const { amount, category, paymentMethod, date, description, notes } = req.body;

        if (amount === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: "Amount and category are required"
            });
        }

        const expense = await Expense.create({
            user: req.user._id,
            amount,
            category,
            paymentMethod,
            date,
            description,
            notes
        });

        return res.status(201).json({
            success: true,
            message: "Expense created successfully",
            data: expense
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getExpense = async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user._id })
            .populate("user", "userId name email currency");

        return res.status(200).json({ success: true, data: expenses });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getExpenseById = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid expense ID" });
        }

        const expense = await Expense.findOne({ id, user: req.user._id })
            .populate("user", "userId name email currency");

        if (!expense) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }

        return res.status(200).json({ success: true, data: expense });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid expense ID" });
        }

        const expense = await Expense.findOneAndDelete({ id, user: req.user._id });

        if (!expense) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully",
            data: expense
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid expense ID" });
        }

        const allowedFields = ["amount", "category", "paymentMethod", "date", "description", "notes"];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields supplied for update" });
        }

        const expense = await Expense.findOneAndUpdate(
            { id, user: req.user._id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            data: expense
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createExpense,
    getExpense,
    getExpenseById,
    deleteExpense,
    updateExpense
};
