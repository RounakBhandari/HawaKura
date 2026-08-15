import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

export const sendMessage = async (req, res) => {
	const { chatId, content, isTimeCapsule, unlockDate } = req.body;

	if (!chatId || !content) {
		return res.status(400).json({ message: "Chat ID and content are required" });
	}

	// Guard clause if auth middleware isn't attaching req.user
	if (!req.user?._id) {
		return res.status(401).json({ message: "Unauthorized: User context missing" });
	}

	const newMessage = {
		sender: req.user._id,
		content,
		chatId,
		isTimeCapsule: Boolean(isTimeCapsule),
		unlockDate: isTimeCapsule && unlockDate ? new Date(unlockDate) : null,
	};

	try {
		let message = await Message.create(newMessage);

		// Populate sender AND nested chat users cleanly in one call
		message = await message.populate([
			{ path: "sender", select: "username avatar email" },
			{
				path: "chatId",
				populate: { path: "users", select: "username avatar email" },
			},
		]);

		await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

		const messageObj = message.toObject();
		const isLocked = messageObj.isTimeCapsule && messageObj.unlockDate && new Date(messageObj.unlockDate) > new Date();

		if (isLocked) {
			messageObj.content = "Locked Time Capsule Message";
			messageObj.isLocked = true;
		} else {
			messageObj.isLocked = false;
		}

		res.status(201).json(messageObj);
	} catch (error) {
		// Log full error stack in backend terminal for instant debugging
		console.error("Error in sendMessage controller:", error);
		res.status(500).json({ message: error.message });
	}
};

export const getMessages = async (req, res) => {
	try {
		const messages = await Message.find({ chatId: req.params.chatId })
			.populate("sender", "username avatar emails")
			.populate("chatId");
		const now = new Date();
		const sanitizedMessages = messages.map((msg) => {
			const msgObj = msg.toObject();
			const isLocked = msgObj.isTimeCapsule && msgObj.unlockDate && new Date(msgObj.unlockDate) > now;

			return {
				...msgObj,
				content: isLocked ? "Locked Time Capsule Message" : msgObj.content,
				isLocked,
			};
		});
		res.json(sanitizedMessages);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
