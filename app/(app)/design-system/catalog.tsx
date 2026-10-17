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
  Textarea,
} from "@/components/ds";

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
        Identidade da Obra Certa: concreto, laranja de segurança, azul de planta. Superfícies brancas sólidas, cantos arredondados (cards 16px, controles 12px, selos em pílula).
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
            { name: "Cards · modais", value: "16px", className: "rounded-lg" },
            { name: "Painéis", value: "20–24px", className: "rounded-2xl" },
            { name: "Selos · barras", value: "pílula", className: "rounded-full" },
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
