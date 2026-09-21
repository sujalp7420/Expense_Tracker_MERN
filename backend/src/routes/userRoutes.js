const express = require("express");
const protect = require("../../middleware/authMiddleware");

const {
    createUser,
    loginUser,
    getUserProfile,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/:userId", protect, updateUser);
router.delete("/:userId", protect, deleteUser);

module.exports = router;
