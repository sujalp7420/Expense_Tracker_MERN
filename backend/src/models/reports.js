const mongoose = require("mongoose");
const Counter = require("./Counter");

const reportSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            unique: true
        },

        // ======================================
        // USER RELATIONSHIP
        // User -> Report
        // ======================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ======================================
        // BUDGET RELATIONSHIP
        // Budget -> Report
        // ======================================

        budgets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Budget"
            }
        ],

        // ======================================
        // EXPENSE RELATIONSHIP
        // Expense -> Report
        // ======================================

        expenses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Expense"
            }
        ],

        reportType: {
            type: String,
            enum: [
                "Monthly",
                "Yearly",
                "Custom",
                "Income",
                "Expense",
                "Budget"
            ],
            required: true
        },

        month: {
            type: Number,
            min: 1,
            max: 12
        },

        year: {
            type: Number,
            required: true
        },

        startDate: {
            type: Date
        },

        endDate: {
            type: Date
        },

        totalIncome: {
            type: Number,
            default: 0,
            min: 0
        },

        totalExpense: {
            type: Number,
            default: 0,
            min: 0
        },

        totalSavings: {
            type: Number,
            default: 0
        },

        fileType: {
            type: String,
            enum: ["PDF", "CSV"],
            required: true
        },

        fileName: {
            type: String,
            required: true,
            trim: true
        },

        filePath: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);


// ======================================
// AUTO-INCREMENT REPORT ID
// ======================================

reportSchema.pre("save", async function () {

    if (!this.isNew) {
        return;
    }

    const counter = await Counter.findByIdAndUpdate(
        "reportId",
        {
            $inc: {
                sequence_value: 1
            }
        },
        {
            new: true,
            upsert: true
        }
    );

    this.id = counter.sequence_value;
});


const Report = mongoose.model("Report", reportSchema);

module.exports = Report;

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const reportSchema = new mongoose.Schema(
//     {
//         id: {
//             type: Number,
//             unique: true
//         },

//         reportType: {
//             type: String,
//             enum: [
//                 "Monthly",
//                 "Yearly",
//                 "Custom",
//                 "Income",
//                 "Expense",
//                 "Budget"
//             ],
//             required: true
//         },

//         month: {
//             type: Number,
//             min: 1,
//             max: 12
//         },

//         year: {
//             type: Number,
//             required: true
//         },

//         startDate: {
//             type: Date
//         },

//         endDate: {
//             type: Date
//         },

//         totalIncome: {
//             type: Number,
//             default: 0,
//             min: 0
//         },

//         totalExpense: {
//             type: Number,
//             default: 0,
//             min: 0
//         },

//         totalSavings: {
//             type: Number,
//             default: 0
//         },

//         fileType: {
//             type: String,
//             enum: ["PDF", "CSV"],
//             required: true
//         },

//         fileName: {
//             type: String,
//             required: true,
//             trim: true
//         },

//         filePath: {
//             type: String,
//             trim: true
//         }
//     },
//     {
//         timestamps: true
//     }
// );


// // ======================================
// // AUTO-INCREMENT REPORT ID
// // ======================================

// reportSchema.pre("save", async function () {

//     // Don't generate a new ID when updating
//     if (!this.isNew) {
//         return;
//     }

//     const counter = await Counter.findByIdAndUpdate(
//         "reportId",
//         {
//             $inc: {
//                 sequence_value: 1
//             }
//         },
//         {
//             new: true,
//             upsert: true
//         }
//     );

//     this.id = counter.sequence_value;
// });


// const Report = mongoose.model("Report", reportSchema);

// module.exports = Report;