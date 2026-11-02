import { useState } from "react";
import Alert from "antd/es/alert";
import Select from "antd/es/select";
import { ButtonComponent } from "@/components/Button/ButtonComponent";
import { SignInAgain } from "@/components/SignInAgain";
import { HerdReportsResults } from "@/components/Table/HerdReportsResults";
import { useHerdReportDownload, useHerdReportProperties } from "@/hooks/useHerdReports";

export function HerdReportsContent() {
	const [propertyId, setPropertyId] = useState<string>();
	const { properties, loading, error, reload } = useHerdReportProperties();
	const { downloadingReportId, error: downloadError, download } = useHerdReportDownload();

	return (
		<>
			<section
				className="shrink-0 space-y-3 px-4 pb-4 md:px-6"
				aria-label="Filtro e exportação de relatórios"
			>
				<div className="flex w-full flex-col gap-1 sm:max-w-sm">
					<label htmlFor="herd-reports-property" className="text-sm text-brand-forest">
						Fazenda
					</label>
					<Select
						virtual={false}
						id="herd-reports-property"
						value={propertyId ?? ""}
						onChange={(value) => setPropertyId(value || undefined)}
						loading={loading}
						disabled={loading || Boolean(error)}
						options={[
							{ value: "", label: "Todas as fazendas" },
							...properties.map(({ id, name }) => ({ value: id, label: name })),
						]}
						className="w-full"
					/>
				</div>
				{loading ? (
					<p role="status" className="text-sm text-brand-forest">
						Carregando fazendas...
					</p>
				) : null}
				{error ? (
					<Alert
						type="error"
						showIcon
						message={error.message}
						action={
							<ButtonComponent className="w-auto rounded-xl" onClick={reload}>
								Tentar novamente
							</ButtonComponent>
						}
					/>
				) : null}
				{error?.status === 401 || downloadError?.status === 401 ? <SignInAgain /> : null}
				{downloadError ? (
					<p role="alert" className="text-sm text-brand-forest">
						{downloadError.message}
					</p>
				) : null}
				<p role="status" aria-live="polite" className="text-sm text-brand-forest">
					{downloadingReportId ? "Baixando relatório de rebanho..." : ""}
				</p>
			</section>
			<HerdReportsResults
				key={propertyId ?? "all"}
				propertyId={propertyId}
				downloadingReportId={downloadingReportId}
				onDownload={(report) => void download(report)}
			/>
		</>
	);
}
