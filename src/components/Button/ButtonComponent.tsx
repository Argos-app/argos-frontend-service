import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
	children: ReactNode;
}

export const ButtonComponent = ({
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
				"flex items-center justify-center gap-2 px-4 h-11 w-full rounded-full text-brand-cream bg-brand-forest hover:bg-brand-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
				className,
			)}
			{...rest}
		>
			{children}
		</button>
	);
};
