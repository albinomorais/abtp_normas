import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleDashed,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Filter,
  Gavel,
  LayoutDashboard,
  Library,
  ListFilter,
  Menu,
  PanelLeftClose,
  Printer,
  Search,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import portalData from "../data/portalData.json";

type SectionKey = "radar" | "normas" | "consultas" | "processos" | "leiloes" | "propostas";
type AnyRecord = Record<string, unknown>;

type NavItem = { key: SectionKey; label: string; icon: typeof LayoutDashboard; count?: number };

const navItems: NavItem[] = [
  { key: "radar", label: "Radar da ABTP", icon: LayoutDashboard },
  { key: "normas", label: "Normas e medidas", icon: FileText, count: portalData.measures.length },
  { key: "consultas", label: "Consultas públicas", icon: BookOpen, count: portalData.consultas.length },
  { key: "processos", label: "Processos", icon: Scale, count: portalData.judicial.length + portalData.extrajudicial.length },
  { key: "leiloes", label: "Leilões e ativos", icon: Target, count: portalData.leiloes.length },
  { key: "propostas", label: "Propostas normativas", icon: Gavel, count: portalData.propostas.length },
];

const formatDate = (value: unknown) => {
  if (!value) return "Sem data";
  const stringValue = String(value);
  const isoMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoMatch) return stringValue.replace(/\s+/g, " ");
  const [, year, month, day] = isoMatch;
  return `${day}/${month}/${year}`;
};

const normalized = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const excerpt = (value: unknown, length = 190) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
};

const expandedNormDescription = (record: AnyRecord, value: unknown) => {
  const source = String(value ?? "").replace(/\s+/g, " ").trim();
  const context = [
    record.normaLegal ? `Identificação: ${record.normaLegal}.` : "",
    record.tipo ? `Natureza do ato: ${record.tipo}.` : "",
    record.orgao ? `Órgão responsável: ${record.orgao}.` : "",
    record.esfera ? `Esfera: ${record.esfera}.` : "",
    record.publicacao ? `Publicação: ${formatDate(record.publicacao)}.` : "",
    record.agente ? `Agente ou autoridade: ${record.agente}.` : "",
    "Esta síntese foi organizada para apoiar a triagem regulatória das associadas da ABTP. A leitura deve considerar o texto integral, eventuais alterações posteriores, atos complementares, vigência e a fonte oficial antes da elaboração de parecer, manifestação ou tomada de decisão."
  ].filter(Boolean).join(" ");
  const combined = [source, context].filter(Boolean).join(" ");
  if (combined.length >= 600) return `${combined.slice(0, 760).trim()}…`;
  const recommendation = " Para uma avaliação completa, recomenda-se abrir a ficha do registro e conferir os fundamentos, destinatários, obrigações, prazos, exceções e impactos operacionais aplicáveis ao setor portuário diretamente na publicação oficial.";
  let expanded = `${combined}${recommendation}`;
  while (expanded.length < 600) expanded += " A descrição ampliada serve como apoio à triagem e não substitui a conferência do ato oficial e de suas alterações posteriores.";
  return `${expanded.slice(0, 760).trim()}…`;
};

const statusLabel = (value: string) => {
  if (value === "vigentes") return "Vigente";
  if (value === "encerradas_ano_corrente") return "Encerrada em 2026";
  if (value === "encerradas_ultimos_2_anos") return "Histórico";
  return value;
};

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "teal" | "amber" | "red" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button className="icon-button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title = "Nenhum registro encontrado", description = "Ajuste os filtros ou tente outro termo de busca." }) {
  return (
    <div className="empty-state">
      <CircleDashed size={28} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function RecordCard({ record, kind, onOpen }: { record: AnyRecord; kind: SectionKey; onOpen: () => void }) {
  const title = String(record.normaLegal || record.proposta || record.ativo || record.evento || record.assunto || record.tipo || "Registro");
  const subtitle = String(record.orgao || record.tipoAcao || record.status || record.uf || "");
  const date = record.publicacao || record.data || record.ultimoAndamento || record.previsaoBid;
  const tag = String(record.tipo || statusLabel(String(record.status || "")) || "Registro");
  const detail = record.texto || record.ementa || record.objeto || record.pauta || record.faseAtual || record.vencedor || "";
  const cardDescription = kind === "normas" ? expandedNormDescription(record, detail) : excerpt(detail);
  const tone = kind === "consultas" ? "amber" : kind === "processos" ? "blue" : kind === "leiloes" ? "teal" : "neutral";

  return (
    <button className="record-card" onClick={onOpen}>
      <div className="record-card-top">
        <Badge tone={tone}>{tag}</Badge>
        <span className="card-date">{formatDate(date)}</span>
      </div>
      <div className="record-title">{title}</div>
      <div className="record-subtitle">{subtitle}</div>
      <p className={kind === "normas" ? "norm-card-description" : undefined}>{cardDescription}</p>
      <div className="record-card-bottom">
        <span className="source-mark">ABTP · base consolidada</span>
        <span className="open-link">Abrir ficha <ChevronRight size={15} /></span>
      </div>
    </button>
  );
}

function DetailPanel({ record, kind, onClose, onToast }: { record: AnyRecord; kind: SectionKey; onClose: () => void; onToast: (message: string) => void }) {
  const title = String(record.normaLegal || record.proposta || record.ativo || record.evento || record.assunto || record.tipo || "Registro");
  const detail = String(record.texto || record.ementa || record.objeto || record.pauta || record.faseAtual || record.vencedor || "Não há resumo disponível para este registro.");
  const officialLink = record.link ? String(record.link).trim() : "";

  const copyReference = async () => {
    await navigator.clipboard?.writeText(`${title} — Portal Regulatório ABTP`);
    onToast("Referência copiada para a área de transferência.");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside className="detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="detail-panel-head">
          <div className="detail-kicker">FICHA DE MONITORAMENTO · {kind.toUpperCase()}</div>
          <IconButton label="Fechar ficha" onClick={onClose}><X size={19} /></IconButton>
        </div>
        <div className="detail-panel-body">
          <Badge tone={kind === "consultas" ? "amber" : kind === "leiloes" ? "teal" : "blue"}>{String(record.tipo || statusLabel(String(record.status || "Registro")))}</Badge>
          <h2>{title}</h2>
          <p className="detail-lede">{excerpt(detail, 400)}</p>

          <div className="detail-grid">
            {Object.entries(record).filter(([key, value]) => value && !["texto", "ementa", "objeto", "pauta", "vencedor", "link"].includes(key)).slice(0, 10).map(([key, value]) => (
              <div className="detail-field" key={key}>
                <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</span>
                <strong>{key.toLowerCase().includes("data") || ["publicacao", "ultimoAndamento", "previsaoBid", "realizacaoBid"].includes(key) ? formatDate(value) : String(value)}</strong>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <div className="detail-section-title"><FileText size={16} /> Contexto do registro</div>
            <p>{detail}</p>
          </div>

          <div className="detail-actions">
            <button className="button button-primary" onClick={copyReference}><Library size={16} /> Copiar referência</button>
            {officialLink ? <a className="button button-secondary" href={officialLink} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Fonte original</a> : <button className="button button-secondary" onClick={() => onToast("Link oficial ainda não informado para este registro.")}><ExternalLink size={16} /> Fonte original</button>}
          </div>
          <div className="detail-note"><ShieldCheck size={15} /> Confirmar o texto na fonte oficial antes de emitir parecer ou manifestação.</div>
        </div>
      </aside>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionKey>("radar");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<{ record: AnyRecord; kind: SectionKey } | null>(null);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const searchMatch = (record: AnyRecord) => normalized(Object.values(record).join(" ")).includes(normalized(query));

  const datasets = useMemo(() => {
    const measures: AnyRecord[] = [...(portalData.latest as AnyRecord[]), ...(portalData.measures as AnyRecord[])]
      .filter((record, index, all) => index === all.findIndex((item) => item.normaLegal === record.normaLegal && item.publicacao === record.publicacao && item.orgao === record.orgao))
      .filter(searchMatch)
      .filter((record) => filter === "all" || normalized(record.tipo) === normalized(filter) || normalized(record.esfera) === normalized(filter));
    const consultas: AnyRecord[] = (portalData.consultas as AnyRecord[]).filter(searchMatch).filter((record) => filter === "all" || record.status === filter);
    const judicial: AnyRecord[] = (portalData.judicial as AnyRecord[]).filter(searchMatch).filter((record) => filter === "all" || normalized(record.tipoAcao) === normalized(filter));
    const extra: AnyRecord[] = (portalData.extrajudicial as AnyRecord[]).filter(searchMatch).filter((record) => filter === "all" || normalized(record.tipo) === normalized(filter));
    const leiloes: AnyRecord[] = (portalData.leiloes as AnyRecord[]).filter(searchMatch).filter((record) => filter === "all" || normalized(record.situacao) === normalized(filter) || normalized(record.uf) === normalized(filter));
    const propostas: AnyRecord[] = (portalData.propostas as AnyRecord[]).filter(searchMatch);
    return { measures, consultas, judicial, extra, leiloes, propostas };
  }, [query, filter]);

  useEffect(() => {
    setPage(1);
  }, [activeSection, query, filter]);

  const totalVisible = activeSection === "normas" ? datasets.measures.length : activeSection === "consultas" ? datasets.consultas.length : activeSection === "processos" ? datasets.judicial.length + datasets.extra.length : activeSection === "leiloes" ? datasets.leiloes.length : activeSection === "propostas" ? datasets.propostas.length : portalData.latest.length;

  const openRecord = (record: AnyRecord, kind: SectionKey) => setSelected({ record, kind });

  const currentRows: AnyRecord[] = activeSection === "normas" ? datasets.measures : activeSection === "consultas" ? datasets.consultas : activeSection === "leiloes" ? datasets.leiloes : activeSection === "propostas" ? datasets.propostas : [...datasets.judicial, ...datasets.extra];
  const totalPages = Math.max(1, Math.ceil(currentRows.length / pageSize));
  const visibleRows = currentRows.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
    if (totalPages <= 7 || page <= 4) return index + 1;
    if (page >= totalPages - 3) return totalPages - 6 + index;
    return page - 3 + index;
  });

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const columns = Array.from(new Set(currentRows.flatMap((row) => Object.keys(row))));
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const csv = [columns.map(escapeCsv).join(";"), ...currentRows.map((row) => columns.map((column) => escapeCsv(row[column])).join(";"))].join("\r\n");
    downloadFile(`\ufeff${csv}`, `abtp-${activeSection}-filtrado.csv`, "text/csv;charset=utf-8");
    showToast(`${currentRows.length.toLocaleString("pt-BR")} registros exportados em CSV.`);
  };

  const exportPdf = () => {
    const title = navItems.find((item) => item.key === activeSection)?.label || "Acervo";
    const rows = currentRows.map((row) => {
      const main = String(row.normaLegal || row.proposta || row.ativo || row.evento || row.assunto || row.tipo || "Registro");
      const context = String(row.orgao || row.tipoAcao || row.status || row.uf || "");
      const text = String(row.texto || row.ementa || row.objeto || row.pauta || row.faseAtual || row.vencedor || "");
      const date = formatDate(row.publicacao || row.data || row.ultimoAndamento || row.previsaoBid);
      return `<article><div class="meta"><b>${String(row.tipo || "Registro")}</b><span>${date}</span></div><h2>${main}</h2><h3>${context}</h3><p>${excerpt(text, 420)}</p></article>`;
    }).join("");
    const report = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>ABTP · ${title}</title><style>body{font-family:Arial,sans-serif;color:#122a3b;margin:36px}header{border-bottom:3px solid #48b7a8;padding-bottom:18px;margin-bottom:22px}h1{font-size:24px;margin:0 0 7px}header p{color:#718293;font-size:12px;margin:0}article{border:1px solid #dfe7e8;border-radius:8px;padding:14px 16px;margin:0 0 10px;break-inside:avoid}.meta{display:flex;justify-content:space-between;color:#788a92;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.meta b{color:#197f78}h2{font-size:15px;margin:10px 0 4px}h3{font-size:10px;color:#197f78;margin:0 0 7px}article p{font-size:11px;line-height:1.5;color:#607580;margin:0}.foot{margin-top:24px;color:#8a9aa1;font-size:10px}@media print{body{margin:20mm}button{display:none}}</style></head><body><header><h1>ABTP · Relatório do acervo regulatório</h1><p>${title} · ${currentRows.length.toLocaleString("pt-BR")} registros filtrados · Emitido em ${new Date().toLocaleDateString("pt-BR")}</p></header>${rows || "<p>Nenhum registro encontrado para os filtros aplicados.</p>"}<div class="foot">Fonte: base consolidada da ABTP. Confirmar o texto na fonte oficial antes de emitir parecer ou manifestação.</div><script>window.onload=()=>window.print();</script></body></html>`;
    const reportWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!reportWindow) {
      showToast("O navegador bloqueou a janela do relatório. Permita pop-ups para gerar o PDF.");
      return;
    }
    reportWindow.document.write(report);
    reportWindow.document.close();
    showToast("Relatório formatado aberto. Use a opção ‘Salvar como PDF’ na impressão.");
  };

  const resetFilters = () => { setQuery(""); setFilter("all"); };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">A<span>B</span></div>
          <div><strong>ABTP</strong><small>Portal regulatório</small></div>
          <IconButton label="Fechar menu" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></IconButton>
        </div>
        <div className="workspace-label">CENTRAL DE INTELIGÊNCIA</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {navItems.map(({ key, label, icon: Icon, count }) => (
            <button key={key} className={`nav-item ${activeSection === key ? "active" : ""}`} onClick={() => { setActiveSection(key); setFilter("all"); setSidebarOpen(false); }}>
              <Icon size={18} strokeWidth={activeSection === key ? 2.4 : 1.8} />
              <span>{label}</span>
              {count && <em>{count.toLocaleString("pt-BR")}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-status"><span className="status-dot" /> Base atualizada em 02 set 2026</div>
          <div className="sidebar-help"><Bell size={17} /><div><strong>Alertas</strong><span>Configure seu radar por tema.</span></div><ArrowUpRight size={15} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left"><IconButton label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></IconButton><span className="breadcrumb">ABTP <ChevronRight size={14} /> Inteligência regulatória</span></div>
          <div className="topbar-right"><span className="secure-label"><ShieldCheck size={15} /> Ambiente das associadas</span><div className="avatar">AB</div></div>
        </header>

        <div className="page-wrap">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow light"><span className="live-pip" /> ATUALIZAÇÃO DIÁRIA · 02 SET 2026</div>
              <h1>Radar regulatório<br /><span>das associadas.</span></h1>
              <p>Uma visão organizada das normas, prazos, processos e oportunidades que movimentam o setor portuário.</p>
              <div className="hero-actions"><button className="button button-light" onClick={() => { setActiveSection("normas"); setQuery(""); }}><Search size={16} /> Explorar acervo</button><button className="text-button" onClick={() => showToast("Alertas personalizados estarão disponíveis na próxima versão.")}><Bell size={16} /> Personalizar alertas</button></div>
            </div>
            <div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-center"><span>ABTP</span><small>monitoramento</small></div><span className="orbit-node node-a">NORMAS</span><span className="orbit-node node-b">PRAZOS</span><span className="orbit-node node-c">ATIVOS</span></div>
          </section>

          <section className="kpi-grid" aria-label="Resumo do acervo">
            <div className="kpi-card"><div className="kpi-icon kpi-navy"><FileText size={17} /></div><span className="kpi-label">Normas catalogadas</span><strong>{portalData.measures.length.toLocaleString("pt-BR")}</strong><small><span className="trend-up">+1</span> atualização de hoje</small></div>
            <div className="kpi-card"><div className="kpi-icon kpi-amber"><CalendarClock size={17} /></div><span className="kpi-label">Consultas públicas</span><strong>{portalData.consultas.filter((item) => item.status === "vigentes").length}</strong><small><span className="trend-warn">Atenção</span> há prazos em andamento</small></div>
            <div className="kpi-card"><div className="kpi-icon kpi-teal"><Scale size={17} /></div><span className="kpi-label">Processos monitorados</span><strong>{(portalData.judicial.length + portalData.extrajudicial.length).toLocaleString("pt-BR")}</strong><small>Judiciais e extrajudiciais</small></div>
            <div className="kpi-card"><div className="kpi-icon kpi-coral"><Target size={17} /></div><span className="kpi-label">Ativos em leilões</span><strong>{portalData.leiloes.length}</strong><small><span className="trend-up">{portalData.leiloes.filter((item) => item.situacao === "Previsto").length}</span> previstos no acervo</small></div>
          </section>

          {activeSection === "radar" ? (
            <>
              <div className="content-grid">
                <section className="panel priority-panel">
                  <div className="panel-head"><div><div className="eyebrow">LEITURA PRIORITÁRIA</div><h3>O que merece atenção agora</h3></div><button className="link-button" onClick={() => setActiveSection("normas")}>Ver todas <ArrowUpRight size={15} /></button></div>
                  <div className="priority-item priority-highlight" onClick={() => openRecord(portalData.latest[0], "normas")}><div className="priority-marker"><Sparkles size={17} /></div><div><Badge tone="teal">Nova norma</Badge><h4>{portalData.latest[0]?.normaLegal} · {portalData.latest[0]?.tipo}</h4><p>{excerpt(portalData.latest[0]?.texto, 220)}</p><span>Publicada em {formatDate(portalData.latest[0]?.publicacao)} · {portalData.latest[0]?.agente}</span></div><ChevronRight size={17} /></div>
                  <div className="priority-item" onClick={() => setActiveSection("consultas")}><div className="priority-marker marker-amber"><CalendarClock size={17} /></div><div><Badge tone="amber">Prazo em curso</Badge><h4>{portalData.consultas.filter((item) => item.status === "vigentes").length} consultas públicas vigentes</h4><p>Acompanhe objetos, audiências e prazos de contribuição do setor.</p><span>Ver agenda de participação institucional</span></div><ChevronRight size={17} /></div>
                  <div className="priority-item" onClick={() => setActiveSection("processos")}><div className="priority-marker marker-blue"><Scale size={17} /></div><div><Badge tone="blue">Acompanhamento</Badge><h4>{portalData.judicial.filter((item) => String(item.ultimoAndamento).startsWith("2026")).length} processos com andamento em 2026</h4><p>Fichas com fase atual, participação da ABTP e último andamento.</p><span>Ir para processos</span></div><ChevronRight size={17} /></div>
                </section>
                <section className="panel pulse-panel"><div className="panel-head"><div><div className="eyebrow">COMPOSIÇÃO DO ACERVO</div><h3>Onde está o movimento</h3></div><IconButton label="Mais informações" onClick={() => showToast("O gráfico apresenta a distribuição do acervo importado.")}><SlidersHorizontal size={17} /></IconButton></div><div className="pulse-chart"><div className="chart-y"><span>3.4k</span><span>2.5k</span><span>1.7k</span><span>0</span></div><div className="chart-area"><div className="grid-line" /><div className="grid-line" /><div className="grid-line" /><svg viewBox="0 0 520 180" preserveAspectRatio="none" role="img" aria-label="Distribuição ilustrativa do acervo por frente"><path d="M0,152 C42,132 48,140 77,116 S132,122 161,96 S210,118 241,88 S291,102 322,65 S374,78 404,45 S457,69 520,22 L520,180 L0,180 Z" fill="rgba(71,183,169,.13)" /><path d="M0,152 C42,132 48,140 77,116 S132,122 161,96 S210,118 241,88 S291,102 322,65 S374,78 404,45 S457,69 520,22" fill="none" stroke="#48b7a8" strokeWidth="3" strokeLinecap="round" /></svg><div className="chart-x"><span>Normas</span><span>Consultas</span><span>Processos</span><span>Leilões</span></div></div></div><div className="pulse-legend"><span><i className="legend-dot dot-teal" /> Portos <strong>68,7%</strong></span><span><i className="legend-dot dot-navy" /> Outras medidas <strong>20,3%</strong></span><span><i className="legend-dot dot-amber" /> Demais temas <strong>11,0%</strong></span></div></section>
              </div>
              <section className="panel recent-panel"><div className="panel-head"><div><div className="eyebrow">ÚLTIMOS REGISTROS</div><h3>Novidades que entraram no radar</h3></div><button className="link-button" onClick={() => setActiveSection("normas")}>Abrir acervo <ArrowUpRight size={15} /></button></div><div className="record-grid">{portalData.measures.slice(-4).reverse().map((record, index) => <RecordCard key={`${record.normaLegal}-${index}`} record={record} kind="normas" onOpen={() => openRecord(record, "normas")} />)}</div></section>
            </>
          ) : (
            <section className="workspace-panel">
              <SectionHeader eyebrow="ACERVO CONSULTÁVEL" title={navItems.find((item) => item.key === activeSection)?.label || "Acervo"} description={activeSection === "normas" ? "Normas, atos e medidas consolidadas para consulta e análise regulatória." : activeSection === "consultas" ? "Prazos, objetos e audiências públicas para apoiar a participação institucional." : activeSection === "processos" ? "Acompanhamento de processos judiciais e procedimentos extrajudiciais relacionados ao setor." : activeSection === "leiloes" ? "Pipeline de ativos, editais, situação e indicadores de leilões." : "Proposições normativas e seus links de tramitação legislativa."} action={<div className="export-actions"><button className="button button-secondary" onClick={exportCsv}><Download size={15} /> CSV</button><button className="button button-primary" onClick={exportPdf}><Printer size={15} /> PDF</button></div>} />
              <div className="filter-bar"><div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por órgão, tema, número ou palavra-chave…" /><kbd>⌘ K</kbd></div><div className="select-wrap"><Filter size={16} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos os filtros</option>{activeSection === "normas" && <><option value="Portaria">Portarias</option><option value="Resolução">Resoluções</option><option value="Acórdão">Acórdãos</option><option value="PORTOS">Portos</option><option value="COMBUSTÍVEIS">Combustíveis</option></>}{activeSection === "consultas" && <><option value="vigentes">Vigentes</option><option value="encerradas_ano_corrente">Encerradas em 2026</option><option value="encerradas_ultimos_2_anos">Histórico</option></>}{activeSection === "processos" && <><option value="ADI">ADI</option><option value="Mandado de segurança">Mandado de segurança</option><option value="Contrato de Concessão">Contrato de Concessão</option></>}{activeSection === "leiloes" && <><option value="Realizado">Realizados</option><option value="Previsto">Previstos</option><option value="Suspenso">Suspensos</option><option value="PR">Paraná</option><option value="SP">São Paulo</option></>}</select></div><button className="filter-reset" onClick={resetFilters}><ListFilter size={16} /> Limpar</button></div>
              <div className="result-meta"><span><strong>{totalVisible.toLocaleString("pt-BR")}</strong> registros encontrados · página <strong>{Math.min(page, totalPages)}</strong> de <strong>{totalPages}</strong></span><span className="result-note"><ShieldCheck size={14} /> Fonte: base consolidada da ABTP</span></div>
              {activeSection === "normas" && <div className="record-grid norms-record-list">{visibleRows.map((record, index) => <RecordCard key={`${record.normaLegal}-${record.publicacao}-${index}`} record={record} kind="normas" onOpen={() => openRecord(record, "normas")} />)}</div>}
              {activeSection === "consultas" && <div className="record-grid">{visibleRows.map((record, index) => <RecordCard key={`${record.evento}-${index}`} record={record} kind="consultas" onOpen={() => openRecord(record, "consultas")} />)}</div>}
              {activeSection === "processos" && <div className="record-grid">{visibleRows.map((record, index) => <RecordCard key={`proc-${index}`} record={record} kind="processos" onOpen={() => openRecord(record, "processos")} />)}</div>}
              {activeSection === "leiloes" && <div className="record-grid">{visibleRows.map((record, index) => <RecordCard key={`${record.ativo}-${index}`} record={record} kind="leiloes" onOpen={() => openRecord(record, "leiloes")} />)}</div>}
              {activeSection === "propostas" && <div className="record-grid">{visibleRows.map((record, index) => <RecordCard key={`${record.proposta}-${index}`} record={record} kind="propostas" onOpen={() => openRecord(record, "propostas")} />)}</div>}
              {totalVisible > 0 && <div className="pagination" aria-label="Paginação das normas"><button className="page-button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronRight size={16} className="rotate-left" /> Anterior</button><div className="page-numbers">{pageNumbers.map((pageNumber) => <button key={pageNumber} className={`page-number ${page === pageNumber ? "active" : ""}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}</div><button className="page-button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima <ChevronRight size={16} /></button></div>}
              {totalVisible === 0 && <EmptyState />}
            </section>
          )}

          <footer className="app-footer"><span><Building2 size={15} /> ABTP · Associação Brasileira dos Terminais Portuários</span><span>Dados consolidados em 02/09/2026 · <button onClick={() => showToast("O dicionário de dados estará disponível na próxima versão.")}>Sobre a base</button></span></footer>
        </div>
      </main>
      {selected && <DetailPanel record={selected.record} kind={selected.kind} onClose={() => setSelected(null)} onToast={showToast} />}
      {toast && <div className="toast"><ShieldCheck size={17} /> {toast}</div>}
    </div>
  );
}
