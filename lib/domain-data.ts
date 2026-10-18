/** Tabelas apagadas junto com a obra via ON DELETE CASCADE. */
export const OBRA_CASCADE_TABLES = [
  "budget_categories",
  "materials",
  "task_columns",
  "tasks",
  "task_dependencies",
  "project_rooms",
  "project_room_modules",
  "project_suggested_items",
] as const;

/** Base SINAPI global: sobrevive à exclusão da obra e ao reset de domínio. */
export const KB_GLOBAL_TABLES = [
  "kb_supplier_categories",
  "kb_materials",
  "kb_modules",
  "kb_compositions",
  "kb_packages",
  "kb_package_modules",
] as const;

/** Cadastro geral + base de conhecimento: ao excluir obra, não apaga. */
export const OBRA_PRESERVE_ON_DELETE = ["suppliers", ...KB_GLOBAL_TABLES] as const;

export const SUPPLIER_FK_ON_OBRA_DELETE = "set null";

/**
 * Reset one-off de domínio (migration 0004).
 * Apaga obras e cadastros operacionais; mantém contas.
 */
export const DOMAIN_RESET_TABLES = [
  "task_dependencies",
  "tasks",
  "task_columns",
  "materials",
  "budget_categories",
  "projects",
  "suppliers",
] as const;

export const DOMAIN_KEEP_TABLES = ["users", "sessions", "rate_limits"] as const;

export const MISSING_OBRA_ERROR = "Obra não encontrada. Ela pode ter sido excluída.";
export const MISSING_SUPPLIER_ERROR = "Fornecedor não encontrado. Ele pode ter sido excluído.";
export const MISSING_COLUMN_ERROR = "Coluna não encontrada. Ela pode ter sido excluída.";
export const MISSING_TASK_ERROR = "Tarefa não encontrada. Ela pode ter sido excluída.";
export const MISSING_MATERIAL_ERROR = "Material não encontrado. Ele pode ter sido excluído.";

const STORAGE_KEYS = [
  "obra-certa:selected-project",
  "selectedProjectId",
  "obraCerta.selectedProject",
  "obraCerta.selectedObra",
];

export const SELECTED_PROJECT_STORAGE_KEYS = STORAGE_KEYS;

export function formatProjectDeleteWarning(counts: { tasks: number; materials: number }) {
  const tasks = `${counts.tasks} ${counts.tasks === 1 ? "tarefa" : "tarefas"}`;
  const materials = `${counts.materials} ${counts.materials === 1 ? "material" : "materiais"}`;
  return `Isso apaga ${tasks} e ${materials} desta obra.`;
}

