const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		googleID: String,
		username: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
		},
		password: {
			type: String,
		},
		image: String,
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;