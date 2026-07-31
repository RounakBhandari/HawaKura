import mongoose from "mongoose";

const chatSchema = mongoose.Schema(
	{
		user: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
	},
	{ timestamps: true },
);

export default mongoose.model("Chat", chatSchema);
