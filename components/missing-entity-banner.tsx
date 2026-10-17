import { Alert } from "@/components/ds";

export function MissingEntityBanner({ aviso }: { aviso?: string }) {
  if (aviso === "obra-inexistente") {
    return (
      <Alert tone="warning" title="Obra não encontrada">
        A obra não existe mais — ela pode ter sido excluída. Escolha outra na lista.
      </Alert>
    );
  }
  if (aviso === "fornecedor-inexistente") {
    return (
      <Alert tone="warning" title="Fornecedor não encontrado">
        O fornecedor não existe mais — ele pode ter sido excluído. Escolha outro na lista.
      </Alert>
    );
  }
  return null;
}
