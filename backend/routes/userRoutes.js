import express from "express";
import { registerUser, loginUser, getUserProfile, allUsers } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.get("/", protect, allUsers);

export default router;
