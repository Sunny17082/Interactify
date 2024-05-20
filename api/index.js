const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const app = express();
const ws = require("ws");
const Message = require("./models/message");
const fs = require("fs");

const PORT = process.env.PORT;

const jwtSecret = process.env.SECRET;

const bcryptSalt = bcrypt.genSaltSync(10);

app.use(express.json());

app.use(cookieParser());

app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(
	cors({
		credentials: true,
		origin: process.env.CLIENT_URL,
	})
);

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Connection successful..."))
	.catch((err) => console.log(err));

async function getUserDataFromRequest(req) {
	return new Promise((resolve, reject) => {
		const token = req.cookies?.token;
		if (token) {
			jwt.verify(token, jwtSecret, {}, (err, userData) => {
				if (err) throw err;
				resolve(userData);
			});
		} else {
			reject("no token");
		}
	});
}

app.get("/profile", async (req, res) => {
	const token = req.cookies?.token;
	if (token) {
		jwt.verify(token, jwtSecret, {}, (err, userData) => {
			// if (err) throw err;
			res.json(userData);
		});
	} else {
		res.json("no token");
	}
});

app.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		const foundUser = await User.findOne({ username });
		if (foundUser) {
			const correctPassword = bcrypt.compareSync(
				password,
				foundUser.password
			);
			if (correctPassword) {
				jwt.sign(
					{ userId: foundUser._id, username },
					jwtSecret,
					{},
					(err, token) => {
						if (err) throw err;
						res.cookie("token", token).status(201).json({
							id: foundUser._id,
							username,
						});
					}
				);
			} else {
				res.json({ msg: "Wrong password!", status: false });
			}
		} else {
			res.json({ msg: "User not found!", status: false });
		}
	} catch (err) {
		res.status(500).json(err);
	}
});

app.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;
		const usernameCheck = await User.findOne({ username });
		if (usernameCheck)
			return res.json({ msg: "Username already exist", status: false });
		const emailCheck = await User.findOne({ email });
		if (emailCheck) {
			return res.json({ msg: "Email already exist", status: false });
		}
		const userDoc = await User.create({
			username,
			email,
			password: bcrypt.hashSync(password, bcryptSalt),
		});
		jwt.sign(
			{ userId: userDoc._id, username },
			jwtSecret,
			{},
			(err, token) => {
				if (err) throw err;
				res.cookie("token", token).status(201).json({
					id: userDoc._id,
					username,
				});
			}
		);
	} catch (err) {
		res.status(500).json("error");
	}
});

app.post("/logout", (req, res) => {
	res.cookie("token", "").json("ok");
});

app.get("/messages/:userId", async (req, res) => {
	const { userId } = req.params;
	const userData = await getUserDataFromRequest(req);
	const ourUserId = userData.userId;
	const messages = await Message.find({
		sender: { $in: [userId, ourUserId] },
		recipient: { $in: [userId, ourUserId] },
	}).sort({ createdAt: 1 });
	res.json(messages);
});

app.get("/people", async (req, res) => {
	const users = await User.find({}, { _id: 1, username: 1 });
	res.json(users);
});

const server = app.listen(PORT, () => {
	console.log(`Server started on Port ${PORT}...`);
});

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {
	function notifyAboutOnlinePeople() {
		[...wss.clients].forEach((client) => {
			client.send(
				JSON.stringify({
					online: [...wss.clients].map((c) => ({
						userId: c.userId,
						username: c.username,
					})),
				})
			);
		});
	}

	connection.isAlive = true;

	connection.timer = setInterval(() => {
		connection.ping();
		connection.deathTimer = setTimeout(() => {
			connection.isAlive = false;
			clearInterval(connection.timer);
			connection.terminate();
			notifyAboutOnlinePeople();
		}, 1000);
	}, 5000);

	connection.on("pong", () => {
		clearTimeout(connection.deathTimer);
	});

	//read username or id from the cookie for this connection
	const cookies = req.headers.cookie;
	if (cookies) {
		const tokenCookieString = cookies
			.split(";")
			.find((str) => str.startsWith("token="));
		if (tokenCookieString) {
			const token = tokenCookieString.split("=")[1];
			if (token) {
				jwt.verify(token, jwtSecret, {}, (err, userData) => {
					if (err) throw err;
					const { userId, username } = userData;
					connection.userId = userId;
					connection.username = username;
				});
			}
		}
	}

	connection.on("message", async (message) => {
		const messageData = JSON.parse(message.toString());
		const { recipient, text, file } = messageData; 
		let filename = null;
		if (file) {
			console.log("size", file.data.length);
			const parts = file.name.split(".");
			const ext = parts[parts.length - 1];
			filename = Date.now() + "." + ext;
			const path = __dirname + "/uploads/" + filename;
			const bufferData = Buffer.from(file.data.split(",")[1], "base64");
			fs.writeFile(path, bufferData, () => {
				console.log("file saved: " + path);
			});
		}
		if (recipient && (text || file)) {
			const messageDoc = await Message.create({
				sender: connection.userId,
				recipient,
				text,
				file: file? filename : null,
			});

			[...wss.clients]
				.filter((c) => c.userId == recipient)
				.forEach((c) =>
					c.send(
						JSON.stringify({
							text,
							sender: connection.userId,
							recipient,
							file: file ? filename : null,
							_id: messageDoc._id,
						})
					)
				);
		}
	});

	// notify everyone about online people
	notifyAboutOnlinePeople();
});
