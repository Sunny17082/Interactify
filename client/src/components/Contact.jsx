import React from "react";
import Avatar from "./Avatar";

const Contact = ({ id, username, selected, onClick, online }) => {
	return (
		<div>
			<div
				key={id}
				onClick={() => {
					onClick(id);
				}}
				className={
					"flex items-center gap-2 cursor-pointer border-b border-gray-100 " +
					(selected ? "bg-blue-100" : "")
				}
			>
				{selected && (
					<div className="w-1 h-16 bg-blue-600 rounded-r-md"></div>
				)}
				<div className="flex gap-2 items-center py-4 pl-4">
					{username && <Avatar online={online} userId={id} username={username} />}
					<span className="text-gray-800">{username}</span>
				</div>
			</div>
		</div>
	);
};

export default Contact;
