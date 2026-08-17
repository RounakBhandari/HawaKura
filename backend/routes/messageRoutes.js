import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMessages, sendMessage, unsendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, getMessages);
router.delete("/:messageId", protect, unsendMessage);
export default router;
