import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib";
import type React from "react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
	children: React.ReactNode;
}

export const InputComponent = ({
	type = "text",
	placeholder,
	value,
	className,
	onChange,
	children,
	...props
}: InputProps) => {
	return (
		<div className="flex items-center mt-6 w-full bg-transparent border border-brand-sand h-12 rounded-full overflow-hidden pl-6 gap-2">
			{children}
			<input
				type={type}
				placeholder={placeholder}
				className={cn(
					"bg-transparent text-brand-ink placeholder-brand-forest/60 outline-none text-sm w-full h-full",
					className,
				)}
				value={value}
				onChange={onChange}
				{...props}
			/>
		</div>
	);
};
