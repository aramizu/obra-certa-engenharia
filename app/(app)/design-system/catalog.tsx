"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  ProgressBar,
  Select,
  Stamp,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TaskChip,
  Textarea,
} from "@/components/ds";
import { TASK_COLORS } from "@/lib/task-color";

const swatches = [
  { name: "Grafite", className: "bg-graphite", hex: "hsl(20 12% 14%)" },
  { name: "Concreto", className: "bg-concrete", hex: "hsl(32 12% 86%)" },
  { name: "Papel", className: "bg-paper border-2 border-graphite", hex: "hsl(40 22% 97%)" },
  { name: "Segurança", className: "bg-primary", hex: "hsl(22 88% 38%)" },
  { name: "Sinalização", className: "bg-signal", hex: "hsl(46 100% 46%)" },
  { name: "Blueprint", className: "bg-blueprint", hex: "hsl(210 58% 30%)" },
  { name: "Concluído", className: "bg-done", hex: "hsl(152 52% 28%)" },
  { name: "Atraso", className: "bg-delay", hex: "hsl(2 74% 42%)" },
];

export function DesignSystemCatalog() {
  const [tab, setTab] = useState("mes");

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      <Alert tone="info" title="Prancha OC-DS">
        Identidade da Obra Certa: concreto, laranja de segurança, azul de planta. Superfícies brancas sólidas, cantos arredondados (cards/tarefas 16px, controles 12px). Selos compactos em pílula. Chip colorido: borda e texto na mesma matiz, contrastando pela luminância do fundo.
      </Alert>

      <section className="space-y-3">
        <h2 className="text-title">Cores</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {swatches.map((swatch) => (
            <div key={swatch.name} className="overflow-hidden rounded-lg border-2 border-graphite bg-white ds-shadow">
              <div className={`h-16 ${swatch.className}`} />
              <div className="p-2">
                <p className="text-label">{swatch.name}</p>
                <p className="font-mono text-[10px]">{swatch.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-title">Raios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Controles", value: "10–12px", className: "rounded-md" },
            { name: "Cards · tarefas", value: "16px · ds-chip", className: "rounded-lg" },
            { name: "Painéis", value: "20–24px", className: "rounded-2xl" },
            { name: "Selos compactos", value: "pílula · ds-chip-pill", className: "rounded-full" },
          ].map((token) => (
            <div key={token.name} className={`border-2 border-graphite bg-white ds-shadow p-4 ${token.className}`}>
              <div className={`h-10 bg-primary ${token.className}`} />
              <p className="text-label mt-3">{token.name}</p>
              <p className="font-mono text-[10px]">{token.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-title">Tipografia</h2>
        <Card>
          <CardHeader>
            <CardTitle>Famílias</CardTitle>
            <CardDescription>Oswald nos títulos, Inter no texto, JetBrains Mono em medidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-display">Canteiro 01</p>
            <p className="text-heading">Orçamento da fundação</p>
            <p className="text-title">Categoria · estrutura</p>
            <p className="text-sm">Corpo Inter para leitura de notas de obra, fornecedores e descrições de tarefa.</p>
            <p className="font-mono text-2xl tabular-nums">R$ 128.450,00 · 14/10/2026 · 12,5 m</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-title">Botões</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="secondary">Concreto</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Excluir</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Compacto</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-title">Campos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ds-name">Nome da obra</Label>
            <Input id="ds-name" defaultValue="Residência Harmonia" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ds-unit">Unidade</Label>
            <Select id="ds-unit" defaultValue="m3">
              <option value="m3">m³</option>
              <option value="kg">kg</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ds-notes">Observação</Label>
            <Textarea id="ds-notes" defaultValue="Conferir cota de nível na prancha A-03." />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-title">Chips · contraste</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Qualquer chip, badge, tag ou balão com fundo colorido usa <code className="font-mono text-xs">.ds-chip-surface</code>.
          Borda ≥2px na mesma matiz via <code className="font-mono text-xs">color-mix(in oklch, fill 68%, black/white)</code>
          (~32% mais escura em fundo claro, mais clara em fundo escuro). Texto mistura ~62% rumo ao ink.
          Gantt, calendário, post-its e selos passam pelo mesmo cálculo. Balões de tarefa usam o raio de <strong>Minhas tarefas</strong> (não pílula).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-label">Fundo claro → borda escura</p>
            <div className="flex flex-wrap gap-2">
              <TaskChip fill="primary-wash" className="px-3 py-1 text-xs font-display uppercase">Segurança</TaskChip>
              <TaskChip fill="signal-wash" className="px-3 py-1 text-xs font-display uppercase">Sinal</TaskChip>
              <TaskChip fill="done-wash" className="px-3 py-1 text-xs font-display uppercase">Concluído</TaskChip>
              <TaskChip fill="hsl(48 92% 70%)" className="px-3 py-1 text-xs font-display uppercase">Post-it</TaskChip>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-label">Fundo escuro → borda clara</p>
            <div className="flex flex-wrap gap-2">
              <TaskChip fill="primary" className="px-3 py-1 text-xs font-display uppercase">Segurança</TaskChip>
              <TaskChip fill="blueprint" className="px-3 py-1 text-xs font-display uppercase">Planta</TaskChip>
              <TaskChip fill="delay" className="px-3 py-1 text-xs font-display uppercase">Atraso</TaskChip>
              <TaskChip fill="graphite" className="px-3 py-1 text-xs font-display uppercase">Grafite</TaskChip>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-label">Paleta de tarefa (mesmo raio do painel)</p>
          <div className="flex flex-wrap gap-2">
            {TASK_COLORS.map((color) => (
              <TaskChip key={color.id} fill={color.fill} className="px-3 py-1 text-xs font-display uppercase tracking-wide">
                {color.label}
              </TaskChip>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-title">KPI · régua · selos</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Orçamento" value="R$ 85.000" progress={62} stamp="FIN" hint="62% executado" />
          <StatCard label="Atraso" value="04" progress={40} stamp="PRAZO" valueClassName="text-delay" />
          <StatCard label="Concluídas" value="18" progress={80} stamp="OK" valueClassName="text-done" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Etiqueta</Badge>
          <Badge tone="safety">Ação</Badge>
          <Badge tone="signal">Alerta</Badge>
          <Badge tone="blueprint">Planta</Badge>
          <Badge tone="done">Concluído</Badge>
          <Badge tone="delay">Atraso</Badge>
          <Badge tone="quoted">Cotado</Badge>
          <Badge tone="purchased">Comprado</Badge>
          <Stamp>REV. 03</Stamp>
        </div>
        <ProgressBar value={72} />
      </section>

      <section className="space-y-3">
        <h2 className="text-title">Alerta · vazio · tabs · tabela</h2>
        <Alert tone="warning" title="Sinalização">Faixa zebrada em pendências e estados vazios.</Alert>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "mes", label: "Mês" },
            { value: "semana", label: "Semana" },
          ]}
        />
        <Card>
          <EmptyState
            illustration="plan"
            title="Nenhuma prancha neste canteiro"
            description="Cadastre a obra para abrir orçamento, kanban e cronograma."
            action={<Button size="sm">Nova obra</Button>}
          />
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cimento CP-II</TableCell>
              <TableCell className="font-mono">40 sc</TableCell>
              <TableCell className="font-mono">R$ 1.280,00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Areia média</TableCell>
              <TableCell className="font-mono">12 m³</TableCell>
              <TableCell className="font-mono">R$ 2.400,00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
