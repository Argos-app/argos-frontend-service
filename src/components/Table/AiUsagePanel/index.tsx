import { useState } from "react";
import { Activity, Coins, Users } from "lucide-react";
import Alert from "antd/es/alert";
import Pagination from "antd/es/pagination";
import { AiUsageDetailsDrawer } from "@/components/AiUsageDetailsDrawer";
import { BigNumberCard } from "@/components/BigNumberCard";
import { SearchComponent } from "@/components/Search/SearchComponent";
import type { AiUsageUser } from "@/types";

import { formatNumber, formatCost } from "@/lib/aiUsageFormat";
import { AiUsageUsersTable } from "@/components/Table/AiUsageUsersTable";

interface AiUsagePanelProps {
	users: AiUsageUser[];
	loading: boolean;
	error: string | null;
	updatedAt: Date | null;
	onRefresh: () => void;
	page: number;
	size: number;
	totalPages: number;
	totalElements: number;
	onPageChange: (page: number) => void;
}

export function AiUsagePanel({
	users,
	loading,
	error,
	updatedAt,
	onRefresh,
	page,
	size,
	totalPages,
	totalElements,
	onPageChange,
}: AiUsagePanelProps) {
	const [query, setQuery] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = users.find((user) => user.userId === selectedId) ?? null;
	const filtered = users.filter((user) =>
		`${user.name ?? ""} ${user.email ?? ""} ${user.userId}`
			.toLocaleLowerCase()
			.includes(query.trim().toLocaleLowerCase()),
	);
	const totals = users.reduce(
		(sum, user) => ({
			calls: sum.calls + user.calls,
			tokens: sum.tokens + user.tokens,
			cost: sum.cost + user.costUsd,
			knownCost: sum.knownCost + user.knownCostCalls,
			unknownCost: sum.unknownCost + user.unknownCostCalls,
		}),
		{ calls: 0, tokens: 0, cost: 0, knownCost: 0, unknownCost: 0 },
	);
	const cards = [
		{
			label: "Usuários com atividade",
			value: formatNumber(users.length),
			icon: Users,
			detail: "Com dados disponíveis",
		},
		{
			label: "Requisições",
			value: formatNumber(totals.calls),
			icon: Activity,
			detail: "Requisições autenticadas",
		},
		{
			label: "Tokens conhecidos",
			value: formatNumber(totals.tokens),
			icon: Coins,
			detail: "Contagem informada pelos modelos",
		},
		{
			label: "Custo conhecido (USD)",
			value: totals.knownCost || totals.calls === 0 ? formatCost(totals.cost) : "—",
			icon: Coins,
			detail: `${formatNumber(totals.unknownCost)} chamada(s) sem custo conhecido`,
		},
	];
	return (
		<main
			id="main-content"
			tabIndex={-1}
			aria-labelledby="ai-usage-title"
			className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-lg border border-brand-sand bg-brand-cream shadow-sm"
		>
			<div className="p-4 md:p-6">
				<header className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 id="ai-usage-title" className="text-3xl font-semibold text-brand-ink">
							Uso de IA por usuários
						</h1>
						<p className="mt-2 text-sm text-brand-forest">
							Acompanhe as requisições e o consumo de tokens por usuário.
						</p>
					</div>
				</header>
				{error && updatedAt && (
					<div className="mt-5">
						<Alert
							type="warning"
							showIcon
							message="Dados desatualizados"
							description={`A última atualização falhou. Os totais exibidos são da consulta de ${updatedAt.toLocaleString("pt-BR")}.`}
						/>
					</div>
				)}
				<div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{cards.map(({ label, value, icon: Icon, detail }) => (
						<BigNumberCard
							key={label}
							label={label}
							value={updatedAt ? value : "—"}
							detail={detail}
							icon={<Icon size={18} />}
						/>
					))}
				</div>
				<div className="mt-8 flex flex-wrap items-end justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold text-brand-ink">
							Atividade por usuário
						</h2>
					</div>
					<SearchComponent
						searchQuery={query}
						setSearchQuery={setQuery}
						placeholder="Pesquisar usuário"
						aria-label="Pesquisar"
						className="sm:w-72"
					/>
				</div>
			</div>
			<AiUsageUsersTable
				users={filtered}
				loading={loading && !updatedAt}
				error={error}
				onRetry={onRefresh}
				onSelect={(user) => setSelectedId(user.userId)}
				isSearching={Boolean(query)}
			/>
			<footer className="flex shrink-0 flex-col gap-3 border-t border-brand-sand p-4 sm:flex-row sm:items-center sm:justify-between">
				<span className="text-sm text-brand-forest" aria-live="polite">
					Página {page + 1} de {Math.max(1, totalPages)} ({totalElements} usuários)
				</span>
				<nav aria-label="Paginação de uso de IA">
					<Pagination
						current={page + 1}
						pageSize={size}
						total={totalElements}
						showSizeChanger={false}
						responsive
						showLessItems
						disabled={loading}
						onChange={(nextPage) => {
							setSelectedId(null);
							onPageChange(nextPage - 1);
						}}
					/>
				</nav>
			</footer>
			<AiUsageDetailsDrawer
				user={selected}
				open={selectedId !== null}
				stale={Boolean(error && updatedAt)}
				onClose={() => setSelectedId(null)}
			/>
		</main>
	);
}
