import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib";

type InputProps = ComponentPropsWithoutRef<"input">;

export const Input = ({
	type = "text",
	placeholder,
	value,
	className,
	onChange,
	...props
}: InputProps) => {
	return (
		<input
			type={type}
			placeholder={placeholder}
			className={cn(
				"bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full",
				className,
			)}
			value={value}
			onChange={onChange}
			{...props}
		/>
	);
};
