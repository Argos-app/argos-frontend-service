import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
	children: React.ReactNode;
}

export const Button = ({
	type = "button",
	children,
	onClick,
	disabled,
	className,
	...rest
}: ButtonProps) => {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"mt-8 w-full h-11 rounded-full text-white bg-emerald-900 hover:opacity-90 transition-opacity",
				className,
			)}
			{...rest}
		>
			{children}
		</button>
	);
};