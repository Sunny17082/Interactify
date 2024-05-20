import React, { useEffect } from "react";

const Avatar = ({ userId, username, online }) => {
	const colors = [
        "bg-teal-200",
		"bg-blue-200",
        "bg-green-200",
		"bg-red-200",
		"bg-purple-200",
		"bg-yellow-200",
	];

    const userIdBase10 = parseInt(userId, 16);
	const color = colors[userIdBase10 % colors.length];
    
	return (
		<div
			className={
				"w-8 h-8 flex items-center justify-center rounded-full relative " +
				color
			}
		>
			<div className="opacity-70">{username[0]}</div>
			{online && (
				<div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border border-white shadow-md"></div>
			)}
			{!online && (
				<div className="absolute w-3 h-3 bg-gray-500 bottom-0 right-0 rounded-full border border-white shadow-md"></div>
			)}
		</div>
	);
};

export default Avatar;
