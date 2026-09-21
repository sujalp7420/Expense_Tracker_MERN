const mongoose = require("mongoose");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        currency: {
            type: String,
            enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY"],
            default: "INR"
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {

    // Don't generate new ID when updating user
    if (!this.isNew) {
        return;
    }

    const counter = await Counter.findByIdAndUpdate(
        "userId",
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

    this.userId = counter.sequence_value;
});


const User = mongoose.model("User", userSchema);

module.exports = User;