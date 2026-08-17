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
		const { chatId } = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;

		const skip = (page - 1) * limit;

		const messages = await Message.find({ chatId })
			.populate("sender", "username avatar email")
			.populate("chatId")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);
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
		res.status(200).json(sanitizedMessages.reverse());
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const unsendMessage = async (req, res) => {
	try {
		const message = await Message.findById(req.params.messageId);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		if (message.sender.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can only unsend your own messages" });
		}

		const timeDiff = Date.now() - new Date(message.createdAt).getTime();
		if (timeDiff > 300000) {
			return res.status(400).json({ message: "You can only unsend messages within 5 minutes of sending" });
		}

		await Message.findByIdAndDelete(req.params.messageId);

		res.status(200).json({ success: true, messageId: req.params.messageId });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
