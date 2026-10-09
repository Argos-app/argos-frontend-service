import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import type React from "react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
	children: React.ReactNode;
	label: string;
}

export const InputComponent = ({
	type = "text",
	placeholder,
	value,
	className,
	onChange,
	children,
	label,
	id,
	...props
}: InputProps) => {
	return (
		<div className="flex items-center mt-6 w-full bg-transparent border border-brand-forest/60 focus-within:border-brand-forest h-12 rounded-full overflow-hidden pl-6 gap-2">
			<label className="sr-only" htmlFor={id}>{label}</label>
			{children}
			<input
				id={id}
				type={type}
				placeholder={placeholder}
				className={cn(
					"bg-transparent text-brand-ink placeholder-brand-forest outline-none text-sm w-full h-full",
					className,
				)}
				value={value}
				onChange={onChange}
				{...props}
			/>
		</div>
	);
};
