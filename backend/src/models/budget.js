const mongoose = require("mongoose");
const Counter = require("./Counter");

const budgetSchema = new mongoose.Schema(
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

        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },

        year: {
            type: Number,
            required: true
        },

        category: {
            type: String,
            default: "Overall",
            trim: true
        },

        limit: {
            type: Number,
            required: true,
            min: 0
        },

        alertPercentage: {
            type: Number,
            default: 80,
            min: 1,
            max: 100
        }
    },
    {
        timestamps: true
    }
);


// Auto-increment Budget ID
budgetSchema.pre("save", async function () {

    if (!this.isNew) {
        return;
    }

    const counter = await Counter.findByIdAndUpdate(
        "budgetId",
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


const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const budgetSchema = new mongoose.Schema(
//     {
//         id: {
//             type: Number,
//             unique: true
//         },

//         month: {
//             type: Number,
//             required: true,
//             min: 1,
//             max: 12
//         },

//         year: {
//             type: Number,
//             required: true
//         },

//         category: {
//             type: String,
//             default: "Overall",
//             trim: true
//         },

//         limit: {
//             type: Number,
//             required: true,
//             min: 0
//         },

//         alertPercentage: {
//             type: Number,
//             default: 80,
//             min: 1,
//             max: 100
//         }
//     },
//     {
//         timestamps: true
//     }
// );


// // Auto-increment Budget ID
// budgetSchema.pre("save", async function () {

//     // Don't generate a new ID when updating
//     if (!this.isNew) {
//         return;
//     }

//     const counter = await Counter.findByIdAndUpdate(
//         "budgetId",
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


// const Budget = mongoose.model("Budget", budgetSchema);

// module.exports = Budget;