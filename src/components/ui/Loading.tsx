import React from "react";
import { RiRefreshLine } from "react-icons/ri";

interface LoadingProps {
	size?: number; // Icon size (default: 36)
	text?: string; // Loading text (default: "Loading...")
	fullScreen?: boolean; // Show in full screen (default: false)
}

const Loading: React.FC<LoadingProps> = ({
	size = 36,
	text = "Loading...",
	fullScreen = false,
}) => {
	return (
		<div
			className={`flex justify-center items-center ${
				fullScreen ? "h-screen" : "h-20"
			}`}
		>
			<span className="mr-2">
				<RiRefreshLine size={size} className="animate-spin" />
			</span>
			<span className="text-lg">
				{text} <span className="animate-bounce">...</span>
			</span>
		</div>
	);
};

export default Loading;
