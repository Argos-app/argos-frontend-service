import { useState, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff } from "lucide-react";
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
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="flex items-center mt-6 w-full bg-transparent border border-brand-forest/60 focus-within:border-brand-forest focus-within:ring-2 focus-within:ring-brand-forest h-12 rounded-full overflow-hidden pl-6 gap-2">
			<label className="sr-only" htmlFor={id}>{label}</label>
			{children}
			<input
				id={id}
				type={type === "password" && showPassword ? "text" : type}
				placeholder={placeholder}
				className={cn(
					"min-w-0 bg-transparent text-brand-ink placeholder-brand-forest outline-none focus-visible:outline-none! text-sm w-full h-full",
					className,
				)}
				value={value}
				onChange={onChange}
				{...props}
			/>
			{type === "password" && (
				<button
					type="button"
					aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
					aria-controls={id}
					disabled={props.disabled}
					onClick={() => setShowPassword((visible) => !visible)}
					className="flex h-full w-12 shrink-0 items-center justify-center text-brand-forest cursor-pointer focus-visible:outline-none! focus-visible:bg-brand-sand disabled:cursor-not-allowed"
				>
					{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
				</button>
			)}
		</div>
	);
};
