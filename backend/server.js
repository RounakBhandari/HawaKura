import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
	res.send("Hawakura API is running");
});

io.on("connection", (socket) => {
	console.log("A user connected", socket.id);

	socket.on("disconnect", () => {
		console.log("User Disconnected", socket.id);
	});
});

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	console.log(`Server running on PORT: ${PORT} `);
});
