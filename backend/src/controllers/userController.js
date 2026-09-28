const User = require("../models/user");
const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
    try {
        const { name, email, password, currency } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const user = new User({
            name,
            email,
            password,
            currency
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                currency: user.currency
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or user ID already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const jwtSecret = process.env.JWT_SECRET || "default_expense_tracker_jwt_secret_key";
        const token = jwt.sign(
            { id: user._id.toString() },
            jwtSecret,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                currency: user.currency,
                token
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (req.user.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own profile"
            });
        }

        const allowedFields = ["name", "email", "password", "currency"];
        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields supplied for update"
            });
        }

        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase().trim();
        }

        const user = await User.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User with this ID not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email is already in use"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (req.user.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own account"
            });
        }

        const user = await User.findOneAndDelete({ userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User with this ID not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                currency: user.currency
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createUser,
    loginUser,
    getUserProfile,
    updateUser,
    deleteUser
};
