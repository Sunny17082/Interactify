import React, { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../UserContext";
import Login from "./Login";
import axios from "axios";
import Avatar from "../components/Avatar";
import Logo from "../components/Logo";
import { uniqBy } from "lodash";
import Contact from "../components/Contact";

const Chat = () => {
	const { username, id, setUsername, setId } = useContext(UserContext);
	const [ws, setWs] = useState("");
	const [onlinePeople, setOnlinePeople] = useState({});
	const [selectedUserId, setSelectedUserId] = useState(null);
	const [newMessageText, setNewMessageText] = useState("");
	const [messages, setMessages] = useState([]);
	const [offlinePeople, setOfflinePeople] = useState({});
	const divUnderMessages = useRef();

	function logout() {
		axios.post("/logout").then(() => {
			setWs("");
			setId("");
			setUsername("");
		});
	}

	function showOnlinePeople(peopleArray) {
		const people = {};
		peopleArray.forEach(({ userId, username }) => {
			people[userId] = username;
		});
		setOnlinePeople(people);
	}

	function handleMessage(ev) {
		const messageData = JSON.parse(ev.data);
		console.log({ ev, messageData });
		if ("online" in messageData) {
			showOnlinePeople(messageData.online);
		} else if ("text" in messageData) {
			if (messageData.sender === selectedUserId) {
				setMessages((prev) => [...prev, { ...messageData }]);
			}
		}
	}

	function connectTOWs() {
		const ws = new WebSocket("ws://localhost:5000");
		setWs(ws);
		ws.addEventListener("message", handleMessage);
		ws.addEventListener("close", () => {
			setTimeout(() => {
				console.log("trying to reconnect...");
				connectTOWs();
			}, 1000);
		});
	}

	useEffect(() => {
		connectTOWs();
	}, []);

	async function sendMessage(ev, file=null) {
		if (ev) {
			ev.preventDefault();
		}
		ws.send(
			JSON.stringify({
				recipient: selectedUserId,
				text: newMessageText,
				file,
			})
		);
		if (file) {
			await axios.get("/messages/" + selectedUserId).then((res) => {
				setMessages(res.data);
			});
		} else {
			setMessages((prev) => [
				...prev,
				{
					text: newMessageText,
					sender: id,
					recipient: selectedUserId,
					_id: Date.now(),
				},
			]);
		}
		setNewMessageText("");
	}

	function sendFile(ev) {
		const reader = new FileReader();
		reader.readAsDataURL(ev.target.files[0]);
		reader.onload = () => {
			sendMessage(null, {
				name: ev.target.files[0].name,
				data: reader.result,
			});
		};
	}

	useEffect(() => {
		const div = divUnderMessages.current;
		if (div) {
			div.scrollIntoView({ behaviour: "smooth", block: "end" });
		}
	}, [messages]);

	useEffect(() => {
		axios.get("/people").then((res) => {
			const offlinePeopleArr = res.data
				.filter((p) => p._id !== id)
				.filter((p) => !Object.keys(onlinePeople).includes(p._id));
			const offlinePeople = {};
			offlinePeopleArr.forEach((p) => {
				offlinePeople[p._id] = p;
			});
			setOfflinePeople(offlinePeople);
		});
	}, [onlinePeople]);

	useEffect(() => {
		if (selectedUserId) {
			axios.get("/messages/" + selectedUserId).then((res) => {
				setMessages(res.data);
			});
		}
	}, [selectedUserId]);

	const onlinePeopleExclOurUser = { ...onlinePeople };
	delete onlinePeopleExclOurUser[id];

	const messagesWithoutDupes = uniqBy(messages, "_id");

	return (
		<div className="flex h-screen">
			<div className="bg-white w-1/3 flex flex-col">
				<div className="flex-grow">
					<Logo />
					{Object.keys(onlinePeopleExclOurUser).map((userId) => (
						<Contact
							key={userId}
							id={userId}
							username={onlinePeopleExclOurUser[userId]}
							onClick={() => {
								setSelectedUserId(userId);
								console.log({ userId });
							}}
							selected={userId === selectedUserId}
							online={true}
						/>
					))}
					{Object.keys(offlinePeople).map((userId) => (
						<Contact
							key={userId}
							id={userId}
							username={offlinePeople[userId].username}
							onClick={() => setSelectedUserId(userId)}
							selected={userId === selectedUserId}
							online={false}
						/>
					))}
				</div>
				<div className="p-2 text-center flex gap-2 items-center justify-center">
					<span className="flex text-sm items-center gap-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="w-5 h-5"
						>
							<path
								fillRule="evenodd"
								d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
								clipRule="evenodd"
							/>
						</svg>
						{username}
					</span>
					<button
						onClick={logout}
						className="text-sm bg-blue-100 px-2 py-1 text-gray-500 border rounde-d-sm"
					>
						logout
					</button>
				</div>
			</div>
			<div className="flex flex-col bg-blue-100 w-2/3">
				<div>
					{selectedUserId && (
						<div className="flex items-center gap-2 p-3">
							<Avatar
								online={
									onlinePeople[selectedUserId] ? true : false
								}
								userId={selectedUserId}
								username={
									onlinePeople[selectedUserId]
										? onlinePeople[selectedUserId]
										: offlinePeople[selectedUserId].username
								}
							/>
							{onlinePeople[selectedUserId]
								? onlinePeople[selectedUserId]
								: offlinePeople[selectedUserId].username}
						</div>
					)}
				</div>
				<div className="flex-grow p-2">
					{!selectedUserId && (
						<div className="w-full h-full flex items-center justify-center text-gray-500">
							<div>&larr; select a person from the sidebar</div>
						</div>
					)}
					{!!selectedUserId && (
						<div className="relative h-full">
							<div className="overflow-y-auto no-scrollbar absolute inset-0">
								{messagesWithoutDupes.map((message) => (
									<div
										key={message._id}
										className={
											message.sender === id
												? "text-right"
												: "text-left"
										}
									>
										<div
											className={
												"text-left inline-block p-2 m-2 rounded-md text-sm w-auto " +
												(message.sender === id
													? "bg-blue-500 text-white"
													: "bg-white text-gray-500")
											}
										>
											{message.text}
											{message.file && (
												<div>
													{![
														"png",
														"jpg",
														"jpeg",
														"webp",
													].includes(
														message.file.split(
															"."
														)[1]
													) && (
														<a
															target="_blank"
															href={
																axios.defaults
																	.baseURL +
																"/uploads/" +
																message.file
															}
															className="flex underline items-center justify-center"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																strokeWidth={
																	1.5
																}
																stroke="currentColor"
																className="w-5 h-5"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
																/>
															</svg>
															{message.file}
														</a>
													)}

													{[
														"png",
														"jpg",
														"jpeg",
														"webp",
													].includes(
														message.file.split(
															"."
														)[1]
													) && (
														<img
															onClick={() => {
																window.open(
																	`${axios.defaults.baseURL}/uploads/${message.file}`,
																	"_blank"
																);
															}}
															src={
																axios.defaults
																	.baseURL +
																"/uploads/" +
																message.file
															}
															className="w-[300px] cursor-pointer"
														/>
													)}
												</div>
											)}
										</div>
									</div>
								))}
								<div ref={divUnderMessages}></div>
								{messagesWithoutDupes.length === 0 && (
									<div className="w-full h-full text-gray-500 flex items-center justify-center">
										Start a conversation...
									</div>
								)}
							</div>
						</div>
					)}
				</div>
				{!!selectedUserId && (
					<form onSubmit={sendMessage} className="flex gap-2 p-2">
						<input
							type="text"
							placeholder="Type your message here"
							className="flex-grow border p-2 rounded-sm"
							value={newMessageText}
							onChange={(ev) =>
								setNewMessageText(ev.target.value)
							}
						/>
						<label className="bg-blue-200 text-gray-600 p-2 rounded-sm border border-blue-200 cursor-pointer">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
								/>
							</svg>
							<input
								type="file"
								className="hidden"
								onChange={sendFile}
							/>
						</label>
						<button
							type="submit"
							className="bg-blue-500 p-2 text-white rounded-sm"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-6 h-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
								/>
							</svg>
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

export default Chat;
