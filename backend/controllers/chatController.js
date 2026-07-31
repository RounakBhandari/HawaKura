import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

export const accessChat = async (req, res) => {
	const { userId } = req.body;

	if (!userId) {
		return res.status(400).json({ message: "User Id parameter is absent" });
	}

	let isChat = await Chat.find({
		users: { $all: [req.user._id, userId] },
	})
		.populate("users", "-password")
		.populate("latestMessage");

	isChat = await User.populate(isChat, {
		path: "latestMessage.sender",
		select: "username avatar email",
	});

	if (isChat.length > 0) {
		res.send(isChat[0]);
	} else {
		const chatData = {
			users: [req.user._id, userId],
		};
		try {
			const createdChat = await Chat.create(chatData);
			const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
			res.status(201).json(fullChat);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}
};

export const fetchChats = async (req, res) => {
	try {
		Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
			.populate("users", "-password")
			.populate("latestMessage")
			.sort({ updatedAt: -1 })
			.then(async (results) => {
				results = await User.populate(results, {
					path: "latestMessage.sender",
					select: "username avatar email",
				});
				res.status(200).send(results);
			});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
