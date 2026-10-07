import { SearchIcon } from "lucide-react";
import { useId, type ComponentPropsWithoutRef } from "react";
import {cn} from "../../lib";

interface SearchProps extends ComponentPropsWithoutRef<"input"> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchComponent = ({ searchQuery, setSearchQuery, placeholder, className, ...props }: SearchProps) => {
	const inputId = useId();
	const accessibleName = typeof props["aria-label"] === "string" ? props["aria-label"] : "Pesquisar";
	return (
		<div className={cn("relative h-10 w-full min-w-50", className)}>
			<div className="pointer-events-none absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center text-brand-forest">
				<SearchIcon size={16} />
			</div>
			<label className="sr-only" htmlFor={inputId}>{accessibleName}</label>

			<input
				id={inputId}
				type="search"
				placeholder={placeholder}
				aria-label="Pesquisar no menu"
				value={searchQuery}
				onChange={(event) => setSearchQuery(event.target.value)}
				className="peer h-full w-full rounded-lg border border-brand-sand bg-transparent px-3 py-2.5 pr-9 text-sm font-normal text-brand-ink outline-none transition-all placeholder:text-brand-forest focus:border-brand-forest focus:ring-1 focus:ring-brand-forest disabled:border-0 disabled:bg-brand-sand/30"
        {...props}
			/>
		</div>
	);
};
