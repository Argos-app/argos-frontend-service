import Pagination from "antd/es/pagination";
import { SignInAgain } from "@/components/SignInAgain";
import { HerdReportsTable } from "@/components/Table/HerdReportsTable";
import { useHerdReports } from "@/hooks/useHerdReports";
import type { HerdReportItem } from "@/types/herd-report.type";

interface HerdReportsResultsProps {
	propertyId?: string;
	downloadingReportId: string | null;
	onDownload: (report: HerdReportItem) => void;
}

export function HerdReportsResults({
	propertyId,
	downloadingReportId,
	onDownload,
}: HerdReportsResultsProps) {
	const {
		data,
		loading,
		error,
		unauthorized,
		page,
		size,
		totalPages,
		totalElements,
		setPage,
		reload,
	} = useHerdReports(propertyId);
	return (
		<>
			{unauthorized ? (
				<div className="px-4 pb-4">
					<SignInAgain />
				</div>
			) : null}
			<HerdReportsTable
				reports={data}
				loading={loading}
				error={error}
				onRetry={reload}
				downloadingReportId={downloadingReportId}
				onDownload={onDownload}
			/>
			<footer className="flex shrink-0 flex-col gap-3 border-t border-brand-sand p-4 sm:flex-row sm:items-center sm:justify-between">
				<span className="text-sm text-brand-forest" aria-live="polite">
					Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} relatórios)
				</span>
				<nav aria-label="Paginação dos relatórios de rebanho">
					<Pagination
						current={page + 1}
						pageSize={size}
						total={totalElements}
						showSizeChanger={false}
						responsive
						showLessItems
						disabled={loading || Boolean(error)}
						onChange={(nextPage) => setPage(nextPage - 1)}
					/>
				</nav>
			</footer>
		</>
	);
}
