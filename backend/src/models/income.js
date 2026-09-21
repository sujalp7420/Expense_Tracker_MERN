const mongoose = require("mongoose");
const Counter = require("./Counter");

const incomeSchema = new mongoose.Schema(
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

        source: {
            type: String,
            required: true,
            trim: true
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


// Auto-increment Income ID
incomeSchema.pre("save", async function () {

    if (!this.isNew) {
        return;
    }

    const counter = await Counter.findByIdAndUpdate(
        "incomeId",
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


const Income = mongoose.model("Income", incomeSchema);

module.exports = Income;


// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const incomeSchema = new mongoose.Schema(
//     {
//         id: {
//             type: Number,
//             unique: true
//         },

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

//         source: {
//             type: String,
//             required: true,
//             trim: true
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


// // Auto-increment incomeId
// incomeSchema.pre("save", async function () {

//     // Don't generate a new ID when updating an existing income
//     if (!this.isNew) {
//         return;
//     }

//     const counter = await Counter.findByIdAndUpdate(
//         "id",
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


// const Income = mongoose.model("Income", incomeSchema);

// module.exports = Income;