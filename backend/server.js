import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	},
});

app.use(cors());

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
	res.send("Hawakura API is running");
});

const activeUsers = new Map();
io.on("connection", (socket) => {
	console.log("A user connected", socket.id);

	socket.on("setup", (userData) => {
		if (!userData?._id) return;
		socket.join(userData._id);

		activeUsers.set(socket.id, userData._id);
		io.emit("active users", Array.from(new Set(activeUsers.values())));

		console.log(`User ${userData.username} joined personal room: ${userData._id}`);
		socket.emit("connected");
	});

	socket.on("join chat", (room) => {
		socket.join(room);
		console.log(`Socket ${socket.id} joined chat room : ${room}`);
	});

	socket.on("typing", (room) => socket.in(room).emit("typing"));
	socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

	socket.on("new message", (newsMessageReceived) => {
		const chat = newsMessageReceived.chatId;
		if (!chat || !chat.users) return console.log("chat.users not defined");

		chat.users.forEach((user) => {
			if (user._id === newsMessageReceived.sender._id) return;

			socket.in(user._id).emit("message received", newsMessageReceived);
		});
	});

	socket.on("message deleted", (deletedData) => {
		const chat = deletedData.chatId;
		if (!chat || !chat.users) return;

		chat.users.forEach((user) => {
			if (user._id === deletedData.senderId) return;

			socket.in(user._id).emit("remove message", deletedData.messageId);
		});
	});
	socket.on("disconnect", () => {
		console.log("User Disconnected");
		const userId = activeUsers.get(socket.id);
		if (userId) {
			activeUsers.delete(socket.id);
			io.emit("active users", Array.from(new Set(activeUsers.values())));
		}
	});
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	console.log(`Server running on PORT: ${PORT} `);
});
