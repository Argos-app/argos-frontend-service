import { SearchIcon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import {cn} from "../../lib";

interface SearchProps extends ComponentPropsWithoutRef<"input"> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchComponent = ({ searchQuery, setSearchQuery, placeholder, className, ...props }: SearchProps) => {
	return (
		<div className={cn("relative h-10 w-full min-w-50", className)}>
			<div className="pointer-events-none absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center text-brand-forest/70">
				<SearchIcon size={16} />
			</div>

			<input
				id="sidebar-search"
				type="search"
				placeholder={placeholder}
				aria-label="Pesquisar no menu"
				value={searchQuery}
				onChange={(event) => setSearchQuery(event.target.value)}
				className="peer h-full w-full rounded-lg border border-brand-sand bg-transparent px-3 py-2.5 pr-9 text-sm font-normal text-brand-ink outline-none transition-all placeholder:text-brand-forest/50 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown disabled:border-0 disabled:bg-brand-sand/30"
        {...props}
			/>
		</div>
	);
};
