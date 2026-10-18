import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculatePayroll } from '../calculations/payroll.js';

const money = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
const stamp = () => new Date().toISOString().slice(0, 10);
const fileSafe = value => String(value || 'Payroll').trim().replace(/[^\w-]+/g, '_');
const HEAD = ['Sr', 'Name', 'Salary', 'Hour', 'Amt', 'OT Hour', 'OT Amt', 'Amount'];

function sheetRows(employees, settings) {
  return employees.map((e, i) => {
    const c = calculatePayroll(e, settings);
    return {
      'Sr': i + 1,
      'Name': e.name,
      'Salary': Number(e.salary) || 0,
      'Hour': Number(e.normalHours) || 0,
      'Amt': c.normalAmount,
      'OT Hour': Number(e.otHours) || 0,
      'OT Amt': c.otAmount,
      'Amount': c.totalPayable
    };
  });
}

export function exportExcel(employees, settings, period) {
  const rows = sheetRows(employees, settings);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEAD });
  ws['!cols'] = [{wch:8},{wch:24},{wch:14},{wch:12},{wch:15},{wch:12},{wch:15},{wch:16}];
  if (rows.length) {
    ws['!autofilter'] = { ref: `A1:H${rows.length + 1}` };
    const totalRow = rows.length + 2;
    XLSX.utils.sheet_add_aoa(ws, [['','Total',{t:'n',f:`SUM(C2:C${rows.length+1})`},'',{t:'n',f:`SUM(E2:E${rows.length+1})`},'',{t:'n',f:`SUM(G2:G${rows.length+1})`},{t:'n',f:`SUM(H2:H${rows.length+1})`}]], { origin: `A${totalRow}` });
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Salary Sheet');
  const summary = [
    ['SARAFRAJ PAYROLL PRO'],
    ['Designed by Er. Sarafraj Navaz'],
    ['Payroll Period', period],
    ['Report Date', stamp()],
    ['Employee Count', employees.length],
    ['Total Salary', rows.reduce((s,r)=>s+r.Salary,0)],
    ['Total Normal Amount', rows.reduce((s,r)=>s+r.Amt,0)],
    ['Total OT Amount', rows.reduce((s,r)=>s+r['OT Amt'],0)],
    ['Total Amount', rows.reduce((s,r)=>s+r.Amount,0)]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Setting','Value'],
    ['Divisor', settings.divisor],
    ['OT multiplier', settings.otMultiplier],
    ['Normal formula', 'Hour × Salary ÷ Divisor'],
    ['OT formula', 'OT Hour × Salary ÷ Divisor × OT multiplier'],
    ['Amount formula', 'Amt + OT Amt']
  ]), 'Settings');
  XLSX.writeFile(wb, `Sarafraj_Salary_Sheet_${fileSafe(period)}.xlsx`);
}

// Premium white PDF. Helvetica has no rupee glyph, so amounts are written as plain numbers with "Rs." in the title/total.
export function exportPDF(employees, settings, period, selected = null) {
  const list = selected ? [selected] : employees;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const NAVY = [14, 23, 38], GOLD = [184, 146, 72], INK = [30, 41, 59], MUTED = [110, 122, 140];

  const calc = list.map(e => ({ e, c: calculatePayroll(e, settings) }));
  const body = calc.map(({ e, c }, i) => [
    selected ? 1 : i + 1, e.name, money(e.salary), Number(e.normalHours) || 0,
    money(c.normalAmount), Number(e.otHours) || 0, money(c.otAmount), money(c.totalPayable)
  ]);
  const totals = calc.reduce((a, { e, c }) => ({
    salary: a.salary + (Number(e.salary) || 0), amt: a.amt + c.normalAmount,
    ot: a.ot + c.otAmount, total: a.total + c.totalPayable
  }), { salary: 0, amt: 0, ot: 0, total: 0 });

  // Header band
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 92, 'F');
  doc.setFillColor(...GOLD); doc.rect(0, 92, W, 3, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text(selected ? 'Salary Statement' : 'Salary Sheet', 40, 44);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...GOLD);
  doc.text('SARAFRAJ PAYROLL PRO', 40, 64);
  doc.setTextColor(210, 218, 230);
  doc.text(`Period: ${period}`, W - 40, 44, { align: 'right' });
  doc.text(`Generated: ${stamp()}`, W - 40, 64, { align: 'right' });

  if (selected) {
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(selected.name, 40, 125);
  }

  autoTable(doc, {
    startY: selected ? 138 : 118,
    head: [HEAD],
    body,
    foot: [['', 'Total', money(totals.salary), '', money(totals.amt), '', money(totals.ot), money(totals.total)]],
    showFoot: 'lastPage',
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 7, bottom: 7, left: 6, right: 6 }, textColor: INK, lineColor: [226, 231, 238], lineWidth: { bottom: 0.6 } },
    headStyles: { fillColor: [244, 246, 249], textColor: MUTED, fontStyle: 'bold', fontSize: 8.5, lineWidth: { bottom: 1.2 }, lineColor: GOLD },
    footStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', lineWidth: 0 },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' }, 1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
      5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: d => {
      if (d.section === 'head' || d.section === 'foot') {
        if (d.column.index >= 2) d.cell.styles.halign = 'right';
        if (d.column.index === 0) d.cell.styles.halign = 'center';
      }
    },
    margin: { left: 40, right: 40, bottom: 50 },
    didDrawPage: () => {
      doc.setDrawColor(226, 231, 238); doc.line(40, H - 38, W - 40, H - 38);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text('Sarafraj Payroll Pro  |  Designed by Er. Sarafraj Navaz', 40, H - 24);
      doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, W - 40, H - 24, { align: 'right' });
    }
  });

  const y = (doc.lastAutoTable?.finalY || 140) + 26;
  if (y < H - 70) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    doc.text(`Amt = Hour x Salary / ${settings.divisor}     OT Amt = OT Hour x Salary / ${settings.divisor} x ${settings.otMultiplier}     Amount = Amt + OT Amt`, 40, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...INK);
    doc.text(`Total payable: Rs. ${money(totals.total)}`, W - 40, y + 24, { align: 'right' });
  }
  doc.save(selected ? `Salary_${fileSafe(selected.name)}_${fileSafe(period)}.pdf` : `Sarafraj_Salary_Sheet_${fileSafe(period)}.pdf`);
}

export function exportCSV(employees, settings, period = 'Payroll') {
  const ws = XLSX.utils.json_to_sheet(sheetRows(employees, settings), { header: HEAD });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Salary Sheet');
  XLSX.writeFile(wb, `Sarafraj_Salary_Sheet_${fileSafe(period)}.csv`, { bookType: 'csv' });
}

export function importCSVFile(file, onData, onError) {
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }).filter(r => r['Name'] || r['Employee Name']);
      const mapped = rows.map((r, i) => ({
        id: `IMP-${Date.now()}-${i}`,
        name: String(r['Name'] || r['Employee Name'] || '').trim(),
        salary: Number(r['Salary'] ?? r['Monthly Salary'] ?? 0),
        normalHours: Number(r['Hour'] ?? r['Normal Hours'] ?? 0),
        holidayHours: 0,
        otHours: Number(r['OT Hour'] ?? r['OT Hours'] ?? r['Overtime Hours'] ?? 0)
      }));
      if (!mapped.length || mapped.some(r => !r.name || [r.salary,r.normalHours,r.otHours].some(n => !Number.isFinite(n) || n < 0))) {
        throw new Error('File is empty or has invalid values. Required columns: Name, Salary, Hour, OT Hour.');
      }
      onData(mapped);
    } catch (e) {
      onError(e.message || 'Could not read this file.');
    }
  };
  reader.readAsArrayBuffer(file);
}
