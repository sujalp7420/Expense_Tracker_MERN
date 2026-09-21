const Budget = require("../models/budget");

const getNumericId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const createBudget = async (req, res) => {
    try {
        const { month, year, category, limit, alertPercentage } = req.body;

        if (month === undefined || year === undefined || limit === undefined) {
            return res.status(400).json({
                success: false,
                message: "Month, year and limit are required"
            });
        }

        const budget = await Budget.create({
            user: req.user._id,
            month,
            year,
            category,
            limit,
            alertPercentage
        });

        return res.status(201).json({
            success: true,
            message: "Budget created successfully",
            data: budget
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user._id })
            .populate("user", "userId name email currency");

        return res.status(200).json({ success: true, data: budgets });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getBudgetById = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid budget ID" });
        }

        const budget = await Budget.findOne({ id, user: req.user._id })
            .populate("user", "userId name email currency");

        if (!budget) {
            return res.status(404).json({ success: false, message: "Budget not found" });
        }

        return res.status(200).json({ success: true, data: budget });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateBudget = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid budget ID" });
        }

        const allowedFields = ["month", "year", "category", "limit", "alertPercentage"];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields supplied for update" });
        }

        const budget = await Budget.findOneAndUpdate(
            { id, user: req.user._id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!budget) {
            return res.status(404).json({ success: false, message: "Budget not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Budget updated successfully",
            data: budget
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBudget = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid budget ID" });
        }

        const budget = await Budget.findOneAndDelete({ id, user: req.user._id });

        if (!budget) {
            return res.status(404).json({ success: false, message: "Budget not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Budget deleted successfully",
            data: budget
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createBudget,
    getBudgets,
    getBudgetById,
    updateBudget,
    deleteBudget
};
