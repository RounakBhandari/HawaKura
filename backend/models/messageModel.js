import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
	{
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
		content: { type: String, required: true },
		isTimeCapsule: { type: Boolean, default: false },
		unlockDate: { type: Date, default: null },
	},
	{ timestamps: true },
);

export default mongoose.model("Message", messageSchema);
