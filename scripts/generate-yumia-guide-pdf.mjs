/**
 * Gera o PDF "Guia de Início Rápido — YumIA CRM" para onboarding de usuários.
 *
 * Uso:
 *   node scripts/generate-yumia-guide-pdf.mjs
 *   node scripts/generate-yumia-guide-pdf.mjs --out docs/meu-guia.pdf
 */

import { jsPDF } from 'jspdf';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const COLORS = {
  primary: [15, 23, 42],
  secondary: [100, 116, 139],
  blue: [59, 130, 246],
  emerald: [16, 185, 129],
  purple: [139, 92, 246],
  orange: [249, 115, 22],
  bgLight: [248, 250, 252],
  border: [226, 232, 240],
  white: [255, 255, 255],
};

function parseArgs() {
  const outIdx = process.argv.indexOf('--out');
  const out =
    outIdx >= 0 && process.argv[outIdx + 1]
      ? resolve(process.cwd(), process.argv[outIdx + 1])
      : join(ROOT, 'docs', 'guia-inicio-rapido-yumia.pdf');
  return { out };
}

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

function ensureSpace(doc, y, needed, margin, onNewPage) {
  const pageHeight = doc.internal.pageSize.height;
  if (y + needed > pageHeight - margin) {
    onNewPage();
    return margin;
  }
  return y;
}

function drawHeader(doc, margin, pageWidth) {
  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(margin, 12, 12, 12, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Y', margin + 4.5, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('YumIA CRM', margin + 18, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text('Guia de Início Rápido', margin + 18, 23);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(margin, 30, pageWidth - margin, 30);
}

function drawFooter(doc, margin, pageWidth, pageHeight, pageNum, totalPages) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text('YumIA CRM — Guia de Início Rápido', margin, pageHeight - 10);
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
}

function sectionTitle(doc, text, x, y, contentWidth) {
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(x, y - 5, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(text, x + 4, y + 2);
  return y + 12;
}

function bullet(doc, text, x, y, contentWidth, lineHeight = 5.2) {
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.primary);
  const lines = wrapText(doc, text, contentWidth - 8);
  doc.setFillColor(...COLORS.blue);
  doc.circle(x + 2, y - 1.2, 1.1, 'F');
  doc.text(lines, x + 6, y);
  return y + lines.length * lineHeight + 2;
}

function numberedStep(doc, num, title, body, x, y, contentWidth, lineHeight = 5) {
  const boxSize = 7;
  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(x, y - 5, boxSize, boxSize, 1.5, 1.5, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(String(num), x + boxSize / 2, y, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(title, x + boxSize + 4, y);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  const lines = wrapText(doc, body, contentWidth - boxSize - 6);
  doc.text(lines, x + boxSize + 4, y + 5);
  return y + 5 + lines.length * lineHeight + 6;
}

function comparisonTable(doc, x, y, contentWidth) {
  const rows = [
    ['Pipedrive', 'YumIA CRM', 'Onde fica'],
    ['Pessoa', 'Contato (Pessoa)', 'Contatos → Pessoas'],
    ['Organização', 'Empresa', 'Contatos → Empresas'],
    ['Negócio / Deal', 'Negócio (card)', 'Boards → funil'],
    ['Atividade', 'Atividade', 'Atividades'],
    ['Funil', 'Board + colunas', 'Boards'],
  ];

  const colWidths = [contentWidth * 0.28, contentWidth * 0.34, contentWidth * 0.38];
  let cy = y;
  const rowH = 8;

  rows.forEach((row, ri) => {
    let cx = x;
    row.forEach((cell, ci) => {
      const w = colWidths[ci];
      if (ri === 0) {
        doc.setFillColor(...COLORS.primary);
        doc.rect(cx, cy, w, rowH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(...(ri % 2 === 0 ? COLORS.bgLight : COLORS.white));
        doc.rect(cx, cy, w, rowH, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.primary);
      }
      doc.setFontSize(8.5);
      doc.text(cell, cx + 2, cy + 5.5, { maxWidth: w - 4 });
      doc.setDrawColor(...COLORS.border);
      doc.rect(cx, cy, w, rowH);
      cx += w;
    });
    cy += rowH;
  });

  return cy + 6;
}

function flowDiagram(doc, x, y, contentWidth) {
  const steps = [
    { label: 'Novo lead', color: COLORS.purple },
    { label: 'Contato ou Negócio', color: COLORS.blue },
    { label: 'Atividade', color: COLORS.emerald },
    { label: 'Mover no funil', color: COLORS.orange },
  ];

  const boxW = (contentWidth - 18) / 4;
  const boxH = 14;
  let cx = x;

  steps.forEach((step, i) => {
    doc.setFillColor(...step.color);
    doc.roundedRect(cx, y, boxW, boxH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const lines = wrapText(doc, step.label, boxW - 4);
    doc.text(lines, cx + boxW / 2, y + 6, { align: 'center', maxWidth: boxW - 4 });
    if (i < steps.length - 1) {
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.secondary);
      doc.text('→', cx + boxW + 2, y + 8);
    }
    cx += boxW + 6;
  });

  return y + boxH + 8;
}

function tipBox(doc, text, x, y, contentWidth) {
  const padding = 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const lines = wrapText(doc, text, contentWidth - padding * 2 - 4);
  const h = lines.length * 4.8 + padding * 2 + 2;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, contentWidth, h, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.orange);
  doc.text('Dica importante', x + padding, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.primary);
  doc.text(lines, x + padding, y + 10);
  return y + h + 6;
}

function generateGuide() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - margin * 2;
  const dateStr = new Date().toLocaleDateString('pt-BR');

  let pageNum = 1;
  const startContentY = 38;

  const addPage = () => {
    doc.addPage();
    pageNum += 1;
    drawHeader(doc, margin, pageWidth);
    return startContentY;
  };

  // ── CAPA ──────────────────────────────────────────────────────────────
  try {
    const logoPath = join(ROOT, 'public', 'branding', 'yumia-logo.png');
    if (existsSync(logoPath)) {
      const logoData = readFileSync(logoPath).toString('base64');
      doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', margin, 42, 42, 42);
    }
  } catch {
    doc.setFillColor(...COLORS.blue);
    doc.roundedRect(margin, 42, 42, 42, 4, 4, 'F');
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Y', margin + 15, 70);
  }

  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Guia de Início Rápido', margin, 100);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.text('Como cadastrar clientes e criar atividades no YumIA CRM', margin, 110);

  doc.setFontSize(10);
  doc.text(`Versão ${dateStr}`, margin, 122);

  doc.setDrawColor(...COLORS.border);
  doc.line(margin, 132, pageWidth - margin, 132);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('O que você vai aprender:', margin, 142);

  let y = 150;
  [
    'Entender a diferença entre Contato, Empresa e Negócio',
    'Cadastrar um novo cliente (pessoa ou empresa)',
    'Criar oportunidades no funil de vendas',
    'Registrar tarefas, ligações e reuniões',
    'Organizar o dia a dia no CRM',
  ].forEach(item => {
    y = bullet(doc, item, margin, y, contentWidth);
  });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Este guia foi preparado para quem já usou Pipedrive ou CRMs similares.',
    margin,
    pageHeight - 24
  );

  // ── PÁGINA 2 — CONCEITOS ─────────────────────────────────────────────
  doc.addPage();
  pageNum = 2;
  drawHeader(doc, margin, pageWidth);
  y = startContentY;

  y = sectionTitle(doc, '1. Entenda os conceitos (Pipedrive → YumIA)', margin, y, contentWidth);
  y = bullet(
    doc,
    'No YumIA, "cliente" pode significar três coisas diferentes. Cada uma tem seu lugar no sistema.',
    margin,
    y,
    contentWidth
  );
  y += 2;
  y = comparisonTable(doc, margin, y, contentWidth);

  y = tipBox(
    doc,
    'Toda atividade (tarefa, ligação, reunião) precisa estar ligada a um Negócio. Por isso, crie o negócio no funil antes de cadastrar atividades — ou use a opção de criar contato + negócio de uma vez.',
    margin,
    y,
    contentWidth
  );

  y = sectionTitle(doc, 'Fluxo recomendado', margin, y, contentWidth);
  flowDiagram(doc, margin, y, contentWidth);

  // ── PÁGINA 3 — CLIENTES ──────────────────────────────────────────────
  doc.addPage();
  pageNum = 3;
  drawHeader(doc, margin, pageWidth);
  y = startContentY;

  y = sectionTitle(doc, '2. Como cadastrar um novo cliente', margin, y, contentWidth);
  y = bullet(
    doc,
    'Use a Opção A quando quiser só guardar os dados da pessoa ou empresa. Use a Opção B quando já tiver uma oportunidade de venda para acompanhar no funil.',
    margin,
    y,
    contentWidth
  );
  y += 2;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.blue);
  doc.text('Opção A — Cadastrar pessoa ou empresa', margin, y);
  y += 7;

  y = numberedStep(
    doc,
    1,
    'Abra Contatos',
    'No menu lateral esquerdo, clique em "Contatos".',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    2,
    'Escolha a aba certa',
    'Aba "Pessoas" para cadastrar um contato individual. Aba "Empresas" para cadastrar a organização (ex: restaurante, loja, escritório).',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    3,
    'Clique em Novo Contato ou Nova Empresa',
    'Botão azul no canto superior direito da tela.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    4,
    'Preencha e salve',
    'Nome, telefone, e-mail e empresa (opcional). Ao salvar, o contato fica disponível para vincular a negócios.',
    margin,
    y,
    contentWidth
  );

  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.blue);
  doc.text('Opção B — Criar negócio no funil (mais comum no dia a dia)', margin, y);
  y += 7;

  y = numberedStep(
    doc,
    1,
    'Abra Boards',
    'No menu lateral, clique em "Boards". Você verá o funil com colunas (etapas do processo de venda).',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    2,
    'Clique em Novo Negócio',
    'Botão no topo do funil. Se você tiver mais de um board, confira se está no board correto.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    3,
    'Vincule ou crie o contato',
    'Busque um contato existente no campo de busca, ou crie um novo preenchendo nome, e-mail e telefone na hora.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    4,
    'Defina título e valor',
    'Título = nome da oportunidade (ex: "Reforma Terraço Itália"). Valor = valor estimado do negócio.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    5,
    'Salve',
    'O card aparece na primeira coluna do funil. Arraste entre colunas conforme o negócio avança.',
    margin,
    y,
    contentWidth
  );

  // ── PÁGINA 4 — ATIVIDADES ────────────────────────────────────────────
  doc.addPage();
  pageNum = 4;
  drawHeader(doc, margin, pageWidth);
  y = startContentY;

  y = sectionTitle(doc, '3. Como criar tarefas e atividades', margin, y, contentWidth);
  y = bullet(
    doc,
    'Atividades incluem: Tarefa, Ligação, Reunião e E-mail. Todas ficam na tela "Atividades" e podem ser vistas em lista ou calendário.',
    margin,
    y,
    contentWidth
  );
  y += 2;

  y = numberedStep(
    doc,
    1,
    'Abra Atividades',
    'No menu lateral, clique em "Atividades".',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    2,
    'Clique em Nova Atividade',
    'Botão azul no canto superior direito.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    3,
    'Preencha o formulário',
    'Título: o que você precisa fazer (ex: "Ligar para confirmar orçamento"). Tipo: Tarefa, Ligação, Reunião ou E-mail. Negócio Relacionado: selecione o card do funil — obrigatório. Data e hora: quando deve ser feito.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    4,
    'Clique em Criar Atividade',
    'A atividade aparece na lista. O contato é vinculado automaticamente pelo negócio escolhido.',
    margin,
    y,
    contentWidth
  );
  y = numberedStep(
    doc,
    5,
    'Marque como concluída',
    'Na lista de atividades, clique no checkbox ao lado da tarefa quando terminar.',
    margin,
    y,
    contentWidth
  );

  y = tipBox(
    doc,
    'Se o campo "Negócio Relacionado" estiver vazio, você ainda não criou um negócio no funil. Volte em Boards → Novo Negócio e depois retorne em Atividades.',
    margin,
    y,
    contentWidth
  );

  y = sectionTitle(doc, 'Outras formas de registrar atividade', margin, y, contentWidth);
  y = bullet(
    doc,
    'Dentro do negócio: clique em um card no funil para abrir os detalhes. Na aba Timeline, você pode escrever notas rápidas sobre o que aconteceu.',
    margin,
    y,
    contentWidth
  );
  y = bullet(
    doc,
    'Pelo chat com IA: peça ao assistente YumIA para criar uma tarefa — ele vai sugerir e você aprova antes de salvar.',
    margin,
    y,
    contentWidth
  );

  // ── PÁGINA 5 — DIA A DIA + MENU ──────────────────────────────────────
  doc.addPage();
  pageNum = 5;
  drawHeader(doc, margin, pageWidth);
  y = startContentY;

  y = sectionTitle(doc, '4. Rotina do dia a dia', margin, y, contentWidth);

  const routine = [
    ['Manhã', 'Abra Inbox ou Atividades e veja o que está atrasado ou vence hoje.'],
    ['Durante o dia', 'Registre ligações e reuniões como atividades. Mova cards no funil quando o status mudar.'],
    ['Novo lead', 'Crie negócio no Boards (Opção B) — já cadastra contato + oportunidade de uma vez.'],
    ['Fim do dia', 'Marque atividades concluídas e adie as que não deu para fazer.'],
  ];

  routine.forEach(([when, what]) => {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.blue);
    doc.text(when, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primary);
    const lines = wrapText(doc, what, contentWidth - 28);
    doc.text(lines, margin + 26, y);
    y += Math.max(lines.length * 5, 6) + 3;
  });

  y += 4;
  y = sectionTitle(doc, '5. Menu lateral — referência rápida', margin, y, contentWidth);

  const menuItems = [
    ['Inbox', 'Resumo do dia com prioridades sugeridas pela IA'],
    ['Visão Geral', 'Dashboard com métricas do funil'],
    ['Boards', 'Funil de vendas — negócios em colunas'],
    ['Contatos', 'Pessoas e empresas cadastradas'],
    ['Atividades', 'Tarefas, ligações, reuniões e e-mails'],
    ['Relatórios', 'Exportar performance em PDF'],
    ['Configurações', 'Usuários, IA, integrações'],
  ];

  menuItems.forEach(([label, desc]) => {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(label, margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    const lines = wrapText(doc, desc, contentWidth - 40);
    doc.text(lines, margin + 36, y);
    y += Math.max(lines.length * 4.8, 5) + 2;
  });

  y += 6;
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Precisa de ajuda?', margin + 4, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(9);
  doc.text(
    'Mande um print da tela onde travou para quem te enviou este guia. Na dúvida: Contato → Boards → Atividade.',
    margin + 4,
    y + 14,
    { maxWidth: contentWidth - 8 }
  );

  // Footers em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, margin, pageWidth, pageHeight, i, totalPages);
  }

  return doc;
}

function main() {
  const { out } = parseArgs();
  const outDir = dirname(out);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const doc = generateGuide();
  const buf = doc.output('arraybuffer');
  writeFileSync(out, Buffer.from(buf));

  console.log(`PDF gerado: ${out}`);
  console.log(`Páginas: ${doc.getNumberOfPages()}`);
}

main();
