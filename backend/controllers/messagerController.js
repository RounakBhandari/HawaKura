import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

export const sendMessage = async (req, res) => {
	const { chatId, content, isTimeCapsule, unlockDate } = req.body;

	if (!chatId || !content) {
		return res.status(400).json({ message: "Chat ID and content are required" });
	}

	const newMessage = {
		sender: req.user._id,
		content,
		chatId,
		isTimeCapsule: isTimeCapsule || false,
		unlockDate: isTimeCapsule ? unlockDate : null,
	};

	try {
		let message = await Message.create(newMessage);
		message = await message.populate("sender", "username avatar email");
		message = await message.populate("chatId");

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
		res.status(500).json({ message: error.message });
	}
};

export const getMessages = async (req, res) => {
	try {
		const messages = await Message.find({ chatId: req.param.chatid })
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
