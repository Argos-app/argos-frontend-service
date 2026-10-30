import { useState } from "react";
import { Activity, AlertTriangle, Coins, Users } from "lucide-react";
import Drawer from "antd/es/drawer";
import Alert from "antd/es/alert";
import { AvatarComponent } from "@/components/Avatar";
import { SearchComponent } from "@/components/Search/SearchComponent";
import { DataTable, type Column } from "@/components/Table/DataTable";
import type { AiUsageUser } from "@/types/ai-usage.type";

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const formatCost = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value);
const displayName = (user: AiUsageUser) => user.name || "Usuário sem nome";

export function AiUsagePanel({ users, loading, error, updatedAt, onRefresh }: {
  users: AiUsageUser[]; loading: boolean; error: string | null; updatedAt: Date | null; onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = users.find((user) => user.userId === selectedId) ?? null;
  const filtered = users.filter((user) => `${user.name ?? ""} ${user.email ?? ""} ${user.userId}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const totals = users.reduce((sum, user) => ({ calls: sum.calls + user.calls, tokens: sum.tokens + user.tokens, incomplete: sum.incomplete + user.unknownTokenCalls, cost: sum.cost + Number(user.costUsd), knownCost: sum.knownCost + user.knownCostCalls, unknownCost: sum.unknownCost + user.unknownCostCalls }), { calls: 0, tokens: 0, incomplete: 0, cost: 0, knownCost: 0, unknownCost: 0 });
  const columns: Column<AiUsageUser>[] = [
    { key: "user", header: "Usuário", render: (user) => <div className="flex items-center gap-3"><AvatarComponent name={displayName(user)} photoUrl={user.photoUrl} /><div className="flex flex-col"><button type="button" onClick={() => setSelectedId(user.userId)} className="text-left text-sm text-brand-ink underline decoration-brand-forest/40 underline-offset-4 hover:text-brand-forest">{displayName(user)}</button><span className="text-sm text-brand-forest">{user.email || user.userId}</span></div>{(user.unknownTokenCalls > 0 || user.unknownCostCalls > 0) && <button type="button" onClick={() => setSelectedId(user.userId)} aria-label={`Ver dados incompletos de ${displayName(user)}`} title="Dados incompletos: ver detalhes" className="rounded-md p-2 text-amber-700 hover:bg-brand-sand/50"><AlertTriangle size={18} /></button>}</div> },
    { key: "calls", header: "Requisições", render: (user) => formatNumber(user.calls) },
    { key: "modelCalls", header: "Chamadas ao modelo", render: (user) => formatNumber(user.modelCalls) },
    { key: "tokens", header: "Tokens conhecidos", render: (user) => <span className="font-medium">{formatNumber(user.tokens)}</span> },
    { key: "cost", header: "Custo conhecido (USD)", render: (user) => user.knownCostCalls ? formatCost(Number(user.costUsd)) : "—" },
  ];
  const cards = [
    { label: "Usuários com atividade", value: formatNumber(users.length), icon: Users, detail: "Com dados disponíveis" },
    { label: "Requisições", value: formatNumber(totals.calls), icon: Activity, detail: "Requisições autenticadas" },
    { label: "Tokens conhecidos", value: formatNumber(totals.tokens), icon: Coins, detail: "Contagem informada pelos modelos" },
    { label: "Custo conhecido (USD)", value: totals.knownCost ? formatCost(totals.cost) : "—", icon: Coins, detail: `${formatNumber(totals.unknownCost)} chamada(s) sem custo conhecido` },
  ];
  return <main id="main-content" tabIndex={-1} aria-labelledby="ai-usage-title" className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-lg border border-brand-sand bg-brand-cream shadow-sm">
    <div className="p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-forest">Relatórios / Uso de IA</p><h1 id="ai-usage-title" className="text-3xl font-semibold text-brand-ink">Uso de IA por usuários</h1><p className="mt-2 text-sm text-brand-forest">Acompanhe as requisições e o consumo de tokens por usuário.</p></div>
        <span className="text-xs text-brand-forest" aria-live="polite">{updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString("pt-BR")}` : "Aguardando atualização"}</span>
      </header>
      {error && updatedAt && <div className="mt-5"><Alert type="warning" showIcon message="Dados desatualizados" description={`A última atualização falhou. Os totais exibidos são da consulta de ${updatedAt.toLocaleString("pt-BR")}.`} /></div>}
      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, detail }) => <section key={label} className="rounded-xl border border-brand-sand bg-white/50 p-5"><div className="flex items-center justify-between gap-3"><span className="text-sm text-brand-forest">{label}</span><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-sand/40 text-brand-forest"><Icon size={18} /></span></div><p className="mt-4 text-3xl font-semibold text-brand-ink">{updatedAt ? value : "—"}</p><p className="mt-1 text-xs text-brand-forest">{detail}</p></section>)}</div>
      <div className="mt-5 rounded-lg border border-brand-sand bg-white/40 px-4 py-3 text-sm text-brand-forest">Os dados são atualizados a cada 30 segundos. Os contadores expiram 24 horas após a última atividade e podem estar incompletos. O custo conhecido pode incluir estimativas e ser parcial. {updatedAt && totals.incomplete > 0 ? `${formatNumber(totals.incomplete)} chamada(s) ao modelo têm contagem de tokens incompleta.` : ""}</div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-semibold text-brand-ink">Atividade por usuário</h2><p className="mt-1 text-sm text-brand-forest">Detalhamento dos dados disponíveis no Redis</p></div><SearchComponent searchQuery={query} setSearchQuery={setQuery} placeholder="Pesquisar usuário" className="sm:w-72" /></div>
    </div>
    <DataTable columns={columns} data={filtered} rowKey="userId" loading={loading && !updatedAt} error={error} onRetry={onRefresh} loadingMessage="Carregando uso de IA..." emptyMessage={query ? "Nenhum usuário encontrado para a pesquisa." : "Nenhuma atividade de IA disponível."} className="px-0 text-sm" scrollAreaLabel="Atividade de IA por usuário" scrollAreaTabIndex={0} />
    <Drawer title="Detalhes de uso de IA" width={480} open={selectedId !== null} onClose={() => setSelectedId(null)} rootClassName="argos-user-drawer" destroyOnHidden>
      {selected ? <div className="space-y-6 text-brand-forest">{error && updatedAt && <Alert type="warning" showIcon message="Dados desatualizados" description="A última atualização falhou; estes detalhes são da última consulta bem-sucedida." />}<div className="flex items-center gap-4"><AvatarComponent name={displayName(selected)} photoUrl={selected.photoUrl} className="h-14 w-14 text-base" /><div><h2 className="text-lg font-semibold text-brand-ink">{displayName(selected)}</h2><p className="text-sm">{selected.email || "E-mail não disponível"}</p></div></div><dl className="space-y-3 text-sm">{[
        ["Requisições", formatNumber(selected.calls)],
        ["Chamadas ao modelo", formatNumber(selected.modelCalls)],
        ["Tokens conhecidos", formatNumber(selected.tokens)],
        ["Chamadas com tokens incompletos", formatNumber(selected.unknownTokenCalls)],
        ["Custo conhecido (USD)", selected.knownCostCalls ? formatCost(Number(selected.costUsd)) : "Não disponível"],
        ["Chamadas com custo conhecido", formatNumber(selected.knownCostCalls)],
        ["Chamadas com custo desconhecido", formatNumber(selected.unknownCostCalls)],
      ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-brand-sand/60 pb-3"><dt>{label}</dt><dd className="text-right font-medium text-brand-ink">{value}</dd></div>)}</dl><p className="text-sm">O custo conhecido pode incluir estimativas e ser parcial. Tokens conhecidos podem incluir contagens parciais.</p></div> : <p>Os dados deste usuário não estão mais disponíveis.</p>}
    </Drawer>
  </main>;
}

