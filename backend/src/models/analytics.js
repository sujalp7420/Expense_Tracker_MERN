const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        period: {
            type: String,
            enum: ["Daily", "Monthly", "Yearly", "Custom"],
            required: true
        },

        totalIncome: {
            type: Number,
            default: 0
        },

        totalExpense: {
            type: Number,
            default: 0
        },

        totalSavings: {
            type: Number,
            default: 0
        },

        savingsPercentage: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);


const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;