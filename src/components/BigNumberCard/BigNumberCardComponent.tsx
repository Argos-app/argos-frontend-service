import type { ReactNode } from "react";

interface BigNumberCardProps {
	label: string;
	value: string;
	detail: string;
	icon: ReactNode;
}

export function BigNumberCard({ label, value, detail, icon }: BigNumberCardProps) {
	return (
		<section className="rounded-xl border border-brand-sand bg-white/50 p-5">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm text-brand-forest">{label}</span>
				<span
					aria-hidden="true"
					className="grid h-9 w-9 place-items-center rounded-lg bg-brand-sand/40 text-brand-forest"
				>
					{icon}
				</span>
			</div>
			<h2 className="mt-4 break-all text-xl font-semibold text-brand-ink 2xl:text-3xl">{value}</h2>
			<p className="mt-1 text-xs text-brand-forest">{detail}</p>
		</section>
	);
}
