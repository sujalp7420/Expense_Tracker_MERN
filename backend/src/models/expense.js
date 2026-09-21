const mongoose = require("mongoose");
const Counter = require("./Counter");

const expenseSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            unique: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Card", "Bank Transfer", "Other"],
            default: "Other"
        },

        date: {
            type: Date,
            default: Date.now
        },

        description: {
            type: String,
            trim: true
        },

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);


// Auto-increment Expense ID
expenseSchema.pre("save", async function () {

    if (!this.isNew) {
        return;
    }

    const counter = await Counter.findByIdAndUpdate(
        "expenseId",
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


const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;

// const mongoose = require("mongoose");

// const expenseSchema = new mongoose.Schema(
//     {
//         user: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },

//         amount: {
//             type: Number,
//             required: true,
//             min: 0
//         },

//         category: {
//             type: String,
//             required: true,
//             trim: true
//         },

//         paymentMethod: {
//             type: String,
//             enum: ["Cash", "UPI", "Card", "Bank Transfer", "Other"],
//             default: "Other"
//         },

//         date: {
//             type: Date,
//             default: Date.now
//         },

//         description: {
//             type: String,
//             trim: true
//         },

//         notes: {
//             type: String,
//             trim: true
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// const Expense = mongoose.model("Expense", expenseSchema);

// module.exports = Expense;


// // const mongoose = require("mongoose");
// // const Counter = require("./Counter");

// // const expenseSchema = new mongoose.Schema(
// //     {
// //         id: {
// //             type: Number,
// //             unique: true
// //         },

// //         amount: {
// //             type: Number,
// //             required: true,
// //             min: 0
// //         },

// //         category: {
// //             type: String,
// //             required: true,
// //             trim: true
// //         },

// //         paymentMethod: {
// //             type: String,
// //             enum: ["Cash", "UPI", "Card", "Bank Transfer", "Other"],
// //             default: "Other"
// //         },

// //         date: {
// //             type: Date,
// //             default: Date.now
// //         },

// //         description: {
// //             type: String,
// //             trim: true
// //         },

// //         notes: {
// //             type: String,
// //             trim: true
// //         }
// //     },
// //     {
// //         timestamps: true
// //     }
// // );

// // // Auto-increment ID
// // expenseSchema.pre("save", async function () {

// //     if (!this.isNew) {
// //         return;
// //     }

// //     const counter = await Counter.findByIdAndUpdate(
// //         "expenseId",
// //         {
// //             $inc: {
// //                 sequence_value: 1
// //             }
// //         },
// //         {
// //             new: true,
// //             upsert: true
// //         }
// //     );

// //     this.id = counter.sequence_value;
// // });

// // const Expense = mongoose.model("Expense", expenseSchema);

// // module.exports = Expense;