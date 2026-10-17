import { PageTitle } from "@/components/page-header";
import { DesignSystemCatalog } from "./catalog";

export default function DesignSystemPage() {
  return (
    <>
      <PageTitle
        title="Sistema gráfico"
        description="Identidade Obra Certa — componentes com cantos arredondados"
      />
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <DesignSystemCatalog />
      </main>
    </>
  );
}
