import { writeFileSync } from "fs";
import { DEFAULT_KNOWLEDGE_CATALOG } from "../lib/kb-catalog";

function sqlStr(value: string | null | undefined): string {
  if (value == null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNum(value: number | null | undefined): string {
  if (value == null) return "NULL";
  return String(value);
}

const catalog = DEFAULT_KNOWLEDGE_CATALOG;
const statements: string[] = [];

statements.push("-- Seed SINAPI/Caixa aproximado (apartamento, estrutura pronta). Valores ajustáveis na tela admin.");
statements.push("INSERT INTO \"kb_supplier_categories\" (\"id\", \"slug\", \"name\", \"sort_order\") VALUES");
statements.push(
  catalog.categories.map((item) => `  (${sqlStr(item.id)}, ${sqlStr(item.slug)}, ${sqlStr(item.name)}, ${item.sortOrder})`).join(",\n") +
    "\nON CONFLICT (\"id\") DO NOTHING;"
);

statements.push("--> statement-breakpoint");
statements.push("INSERT INTO \"kb_materials\" (\"id\", \"slug\", \"name\", \"unit\", \"category_id\", \"sinapi_code\", \"notes\") VALUES");
statements.push(
  catalog.materials
    .map(
      (item) =>
        `  (${sqlStr(item.id)}, ${sqlStr(item.slug)}, ${sqlStr(item.name)}, ${sqlStr(item.unit)}, ${sqlStr(item.categoryId)}, ${sqlStr(item.sinapiCode)}, ${sqlStr(item.notes)})`
    )
    .join(",\n") + "\nON CONFLICT (\"id\") DO NOTHING;"
);

statements.push("--> statement-breakpoint");
statements.push(
  "INSERT INTO \"kb_modules\" (\"id\", \"slug\", \"name\", \"description\", \"quantity_unit\", \"qty_from\", \"is_demolition\", \"extra_label\", \"extra_kind\", \"sort_order\") VALUES"
);
statements.push(
  catalog.modules
    .map(
      (item) =>
        `  (${sqlStr(item.id)}, ${sqlStr(item.slug)}, ${sqlStr(item.name)}, ${sqlStr(item.description)}, ${sqlStr(item.quantityUnit)}, ${sqlStr(item.qtyFrom)}, ${item.isDemolition}, ${sqlStr(item.extraLabel)}, ${sqlStr(item.extraKind)}, ${item.sortOrder})`
    )
    .join(",\n") + "\nON CONFLICT (\"id\") DO NOTHING;"
);

statements.push("--> statement-breakpoint");
statements.push("INSERT INTO \"kb_compositions\" (\"id\", \"module_id\", \"material_id\", \"consumption\", \"waste_pct\", \"sinapi_code\") VALUES");
statements.push(
  catalog.compositions
    .map(
      (item) =>
        `  (${sqlStr(item.id)}, ${sqlStr(item.moduleId)}, ${sqlStr(item.materialId)}, ${sqlNum(item.consumption)}, ${sqlNum(item.wastePct)}, ${sqlStr(item.sinapiCode)})`
    )
    .join(",\n") + "\nON CONFLICT (\"id\") DO NOTHING;"
);

statements.push("--> statement-breakpoint");
statements.push(
  "INSERT INTO \"kb_packages\" (\"id\", \"slug\", \"name\", \"description\", \"default_points\", \"default_wall_m\", \"default_count\") VALUES"
);
statements.push(
  catalog.packages
    .map(
      (item) =>
        `  (${sqlStr(item.id)}, ${sqlStr(item.slug)}, ${sqlStr(item.name)}, ${sqlStr(item.description)}, ${sqlNum(item.defaultPoints ?? null)}, ${sqlNum(item.defaultWallM ?? null)}, ${sqlNum(item.defaultCount ?? null)})`
    )
    .join(",\n") + "\nON CONFLICT (\"id\") DO NOTHING;"
);

statements.push("--> statement-breakpoint");
statements.push("DELETE FROM \"kb_package_modules\";");
statements.push("--> statement-breakpoint");
statements.push("INSERT INTO \"kb_package_modules\" (\"package_id\", \"module_id\", \"sort_order\") VALUES");
const links = catalog.packages.flatMap((pkg, pkgIndex) =>
  pkg.moduleIds.map(
    (moduleId, index) => `  (${sqlStr(pkg.id)}, ${sqlStr(moduleId)}, ${pkgIndex * 100 + index})`
  )
);
statements.push(links.join(",\n") + ";");

writeFileSync("migrations/0006_knowledge_base_seed.sql", statements.join("\n") + "\n");
console.log("wrote migrations/0006_knowledge_base_seed.sql");
