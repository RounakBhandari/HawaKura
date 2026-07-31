import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const registerUser = async (req, res) => {
	const { username, email, password } = req.body;
	try {
		const userExists = await User.findOne({ email });
		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ username, email, password });

		if (user) {
			res.status(201).json({
				_id: user._id,
				username: user.username,
				email: user.email,
				avatar: user.avatar,
				token: generateToken(user._id),
			});
		} else {
			res.status(400).json({ message: "Invalid user data" });
		}
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });
		if (user && (await user.matchPassword(password))) {
			res.json({
				_id: user._id,
				username: user.username,
				email: user.email,
				avatar: user.avatar,
				token: generateToken(user._id),
			});
		} else {
			res.status(401).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const getUserProfile = async (req, res) => {
	const user = await User.findById(req.user._id);

	if (user) {
		res.json({
			_id: user._id,
			username: user.username,
			email: user.email,
			avatar: user.avatar,
		});
	} else {
		res.status(404).json({ message: "User not found" });
	}
};

export const allUsers = async (req, res) => {
	const keyword = req.query.search
		? {
				$or: [
					{ username: { $regex: req.query.search, $options: "i" } },
					{ email: { $regex: req.query.search, $options: "i" } },
				],
			}
		: {};

	const users = await User.find(keyword)
		.find({ _id: { $ne: req.user._id } })
		.select("-password");

	res.send(users);
};
