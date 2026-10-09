import Sidebar from "@/components/Sidebar/SidebarComponent";
import { useUser } from "@/hooks/useUser";

export function Home() {
  const { userName } = useUser();

  return (
    <div className="flex h-screen bg-brand-cream">
      <Sidebar />
       <main id="main-content" tabIndex={-1} className="flex-1 p-8">
        <header>
        <h1 className="text-4xl font-semibold text-brand-ink">Olá! {userName}</h1>
        <p className="mt-2 text-brand-forest/80">Selecione uma das opções do painel de controle para visualizar as informações.</p>
        </header>
      </main>
    </div>
  );
}
