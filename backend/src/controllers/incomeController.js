const Income = require("../models/income");

const getNumericId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const createIncome = async (req, res) => {
    try {
        const { amount, source, category, paymentMethod, date, description, notes } = req.body;

        if (amount === undefined || !source || !category) {
            return res.status(400).json({
                success: false,
                message: "Amount, source and category are required"
            });
        }

        const income = await Income.create({
            user: req.user._id,
            amount,
            source,
            category,
            paymentMethod,
            date,
            description,
            notes
        });

        return res.status(201).json({
            success: true,
            message: "Income created successfully",
            data: income
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getIncome = async (req, res) => {
    try {
        const income = await Income.find({ user: req.user._id })
            .populate("user", "userId name email currency");

        return res.status(200).json({ success: true, data: income });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getIncomeById = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid income ID" });
        }

        const income = await Income.findOne({ id, user: req.user._id })
            .populate("user", "userId name email currency");

        if (!income) {
            return res.status(404).json({ success: false, message: "Income not found" });
        }

        return res.status(200).json({ success: true, data: income });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteIncome = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid income ID" });
        }

        const income = await Income.findOneAndDelete({ id, user: req.user._id });

        if (!income) {
            return res.status(404).json({ success: false, message: "Income not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Income deleted successfully",
            data: income
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateIncome = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid income ID" });
        }

        const allowedFields = ["amount", "source", "category", "paymentMethod", "date", "description", "notes"];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields supplied for update" });
        }

        const income = await Income.findOneAndUpdate(
            { id, user: req.user._id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!income) {
            return res.status(404).json({ success: false, message: "Income not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Income updated successfully",
            data: income
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateWholeIncome = async (req, res) => {
    try {
        const id = getNumericId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid income ID" });
        }

        const oldIncome = await Income.findOne({ id, user: req.user._id });
        if (!oldIncome) {
            return res.status(404).json({ success: false, message: "Income not found" });
        }

        const { amount, source, category, paymentMethod, date, description, notes } = req.body;
        if (amount === undefined || !source || !category) {
            return res.status(400).json({
                success: false,
                message: "Amount, source and category are required for PUT"
            });
        }

        const income = await Income.findOneAndReplace(
            { id, user: req.user._id },
            {
                id: oldIncome.id,
                user: req.user._id,
                amount,
                source,
                category,
                paymentMethod,
                date,
                description,
                notes
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Income replaced successfully",
            data: income
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createIncome,
    getIncome,
    getIncomeById,
    deleteIncome,
    updateIncome,
    updateWholeIncome
};
