import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, FileSpreadsheet, FileText, Moon, Pencil, Plus, Search, Settings2, ShieldCheck, Sun, Trash2, Upload, Wallet, X } from 'lucide-react';
import { calculatePayroll, DEFAULT_SETTINGS, DEMO_EMPLOYEES } from './calculations/payroll.js';
import { exportCSV, exportExcel, exportPDF, importCSVFile } from './exports/reports.js';

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
const STORE = 'sarafraj-payroll-pro-v1';
const blank = { id: '', name: '', salary: '', normalHours: '', otHours: '0' };

function getSaved() {
  try { const v = JSON.parse(localStorage.getItem(STORE)); if (v) return v; } catch { /* ignore */ }
  return null;
}

export default function App() {
  const initial = getSaved();
  const [employees, setEmployees] = useState(initial?.employees || DEMO_EMPLOYEES);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, ...(initial?.settings || {}) });
  const [period, setPeriod] = useState(initial?.period || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('order');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('sarafraj-theme') !== 'light');
  const [notice, setNotice] = useState('');
  const restoreRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify({ employees, settings, period })); }, [employees, settings, period]);
  useEffect(() => { localStorage.setItem('sarafraj-theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { if (notice) { const t = setTimeout(() => setNotice(''), 3200); return () => clearTimeout(t); } }, [notice]);

  const rows = useMemo(() => employees.map(e => ({ ...e, ...calculatePayroll(e, settings) })), [employees, settings]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(e => e.name.toLowerCase().includes(q));
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'salary') return [...list].sort((a, b) => b.salary - a.salary);
    if (sort === 'amount') return [...list].sort((a, b) => b.totalPayable - a.totalPayable);
    return list;
  }, [rows, query, sort]);
  const sums = useMemo(() => rows.reduce((a, e) => ({
    salary: a.salary + (Number(e.salary) || 0), normal: a.normal + e.normalAmount, ot: a.ot + e.otAmount, total: a.total + e.totalPayable
  }), { salary: 0, normal: 0, ot: 0, total: 0 }), [rows]);

  const newId = () => `EMP-${String(Math.max(0, ...employees.map(e => Number(String(e.id).match(/(\d+)$/)?.[1] || 0))) + 1).padStart(3, '0')}`;
  const openAdd = () => { setForm({ ...blank, id: newId() }); setEditing(false); setModal(true); };
  const openEdit = e => { setForm({ id: e.id, name: e.name, salary: e.salary, normalHours: e.normalHours, otHours: e.otHours }); setEditing(true); setModal(true); };

  const saveEmployee = ev => {
    ev.preventDefault();
    if (!form.name.trim()) { setNotice('Please enter the name.'); return; }
    if (['salary', 'normalHours', 'otHours'].some(k => form[k] === '' || !Number.isFinite(Number(form[k])) || Number(form[k]) < 0)) {
      setNotice('Salary, Hour and OT Hour must be valid numbers.'); return;
    }
    const clean = { id: form.id || newId(), name: form.name.trim(), salary: Number(form.salary), normalHours: Number(form.normalHours), holidayHours: 0, otHours: Number(form.otHours) };
    if (editing) setEmployees(old => old.map(e => (e.id === clean.id ? clean : e)));
    else setEmployees(old => [...old, { ...clean, id: old.some(e => e.id === clean.id) ? newId() : clean.id }]);
    setModal(false);
    setNotice(editing ? 'Changes saved.' : 'Employee added.');
  };
  const removeEmployee = e => {
    if (confirm(`Delete ${e.name}? This cannot be undone unless you have a backup.`)) { setEmployees(old => old.filter(x => x.id !== e.id)); setNotice('Employee deleted.'); }
  };

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ employees, settings, period, backupCreatedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Sarafraj_Payroll_Backup.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  const restoreBackup = ev => {
    const file = ev.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const b = JSON.parse(r.result);
        if (!Array.isArray(b.employees) || !b.settings) throw new Error();
        if (confirm('Replace current data with this backup?')) { setEmployees(b.employees); setSettings({ ...DEFAULT_SETTINGS, ...b.settings }); setPeriod(b.period || period); setNotice('Backup restored.'); }
      } catch { setNotice('Invalid backup file. Nothing was changed.'); }
      ev.target.value = '';
    };
    r.readAsText(file);
  };
  const importFile = ev => {
    const file = ev.target.files?.[0]; if (!file) return;
    importCSVFile(file, data => {
      const used = new Set(employees.map(e => e.id)); let n = 0;
      const next = data.map(e => { let id = e.id; while (used.has(id)) id = `IMP-${Date.now()}-${n++}`; used.add(id); return { ...e, id }; });
      if (confirm(`Add ${next.length} employees from this file?`)) { setEmployees(old => [...old, ...next]); setNotice(`${next.length} employees imported.`); }
      ev.target.value = '';
    }, err => { setNotice(err); ev.target.value = ''; });
  };

  const downloadPDF = () => { exportPDF(employees, settings, period); setNotice('PDF downloaded.'); };
  const downloadExcel = () => { exportExcel(employees, settings, period); setNotice('Excel downloaded.'); };

  return (
    <div className={dark ? 'app' : 'app light'}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Wallet size={20} /></div>
          <div><b>Sarafraj Payroll Pro</b><small>Designed by Er. Sarafraj Navaz</small></div>
        </div>
        <div className="top-actions">
          <input className="period-input" aria-label="Payroll period" value={period} onChange={e => setPeriod(e.target.value)} />
          <button className="icon-btn" title="Settings" onClick={() => setShowSettings(true)}><Settings2 size={18} /></button>
          <button className="icon-btn" title="Light / dark" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>
      </header>

      <main className="content">
        <section className="hero">
          <div>
            <h1>Salary sheet</h1>
            <p>{period} · {employees.length} employees</p>
          </div>
          <div className="hero-total">
            <span>Total payable</span>
            <b>{fmt(sums.total)}</b>
          </div>
        </section>

        <section className="stats">
          <div><span>Total salary</span><b>{fmt(sums.salary)}</b></div>
          <div><span>Normal amount</span><b>{fmt(sums.normal)}</b></div>
          <div><span>Overtime amount</span><b>{fmt(sums.ot)}</b></div>
          <div><span>OT rate</span><b>{settings.otMultiplier}× · ÷{settings.divisor}</b></div>
        </section>

        <section className="sheet">
          <div className="toolbar">
            <label className="search"><Search size={16} /><input placeholder="Search name" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Clear"><X size={14} /></button>}</label>
            <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
              <option value="order">Sheet order</option>
              <option value="name">Name A–Z</option>
              <option value="salary">Highest salary</option>
              <option value="amount">Highest amount</option>
            </select>
            <div className="spacer" />
            <button className="btn ghost" onClick={openAdd}><Plus size={16} /> Add employee</button>
            <button className="btn ghost" onClick={downloadExcel}><FileSpreadsheet size={16} /> Excel</button>
            <button className="btn gold" onClick={downloadPDF}><FileText size={16} /> Download PDF</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="c">Sr</th><th>Name</th><th className="r">Salary</th><th className="r">Hour</th>
                  <th className="r">Amt</th><th className="r">OT Hour</th><th className="r">OT Amt</th><th className="r">Amount</th><th className="r actions-h"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e, i) => (
                  <tr key={e.id}>
                    <td className="c muted">{i + 1}</td>
                    <td className="name">{e.name}</td>
                    <td className="r">{fmt(e.salary)}</td>
                    <td className="r">{e.normalHours}</td>
                    <td className="r">{fmt(e.normalAmount)}</td>
                    <td className="r">{e.otHours}</td>
                    <td className="r">{fmt(e.otAmount)}</td>
                    <td className="r amount">{fmt(e.totalPayable)}</td>
                    <td className="r">
                      <div className="row-actions">
                        <button title="Edit" onClick={() => openEdit(e)}><Pencil size={15} /></button>
                        <button title="Download this employee's PDF" onClick={() => { exportPDF(employees, settings, period, e); setNotice(`${e.name}'s PDF downloaded.`); }}><FileText size={15} /></button>
                        <button className="danger" title="Delete" onClick={() => removeEmployee(e)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {visible.length > 0 && (
                <tfoot>
                  <tr>
                    <td></td><td>Total</td><td className="r">{fmt(visible.reduce((s, e) => s + (Number(e.salary) || 0), 0))}</td><td></td>
                    <td className="r">{fmt(visible.reduce((s, e) => s + e.normalAmount, 0))}</td><td></td>
                    <td className="r">{fmt(visible.reduce((s, e) => s + e.otAmount, 0))}</td>
                    <td className="r amount">{fmt(visible.reduce((s, e) => s + e.totalPayable, 0))}</td><td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {visible.length === 0 && <div className="empty"><b>No employees found</b><span>Try another name, or add a new employee.</span></div>}
          </div>
        </section>

        <p className="formula">Amt = Hour × Salary ÷ {settings.divisor} &nbsp;·&nbsp; OT Amt = OT Hour × Salary ÷ {settings.divisor} × {settings.otMultiplier} &nbsp;·&nbsp; Amount = Amt + OT Amt</p>
      </main>

      <footer className="footer"><span><ShieldCheck size={13} /> Your data stays in this browser</span><span>© {new Date().getFullYear()} Sarafraj Payroll Pro</span></footer>

      {modal && (
        <div className="backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <form className="dialog" onSubmit={saveEmployee}>
            <div className="dialog-head"><h2>{editing ? 'Edit employee' : 'Add employee'}</h2><button type="button" className="icon-btn" onClick={() => setModal(false)}><X size={18} /></button></div>
            <div className="form-grid">
              <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} autoFocus className="full" placeholder="e.g. INTKHAB" />
              <Field label="Salary (₹)" type="number" min="0" value={form.salary} onChange={v => setForm({ ...form, salary: v })} />
              <Field label="Hour" type="number" min="0" step="0.25" value={form.normalHours} onChange={v => setForm({ ...form, normalHours: v })} />
              <Field label="OT Hour" type="number" min="0" step="0.25" value={form.otHours} onChange={v => setForm({ ...form, otHours: v })} />
            </div>
            {form.salary !== '' && form.normalHours !== '' && (
              <div className="preview"><span>Amount</span><b>{fmt(calculatePayroll(form, settings).totalPayable)}</b></div>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn gold"><Check size={16} /> {editing ? 'Save changes' : 'Add employee'}</button>
            </div>
          </form>
        </div>
      )}

      {showSettings && (
        <div className="backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="dialog wide">
            <div className="dialog-head"><h2>Settings</h2><button className="icon-btn" onClick={() => setShowSettings(false)}><X size={18} /></button></div>
            <h3>Calculation</h3>
            <div className="form-grid">
              <Field label="Divisor" type="number" min="1" value={settings.divisor} onChange={v => setSettings(s => ({ ...s, divisor: v }))} />
              <Field label="OT multiplier" type="number" min="0" step="0.05" value={settings.otMultiplier} onChange={v => setSettings(s => ({ ...s, otMultiplier: v }))} />
            </div>
            <button className="link" onClick={() => { setSettings(DEFAULT_SETTINGS); setNotice('Defaults restored (200 and 1.25).'); }}>Restore defaults (200 and 1.25)</button>
            <h3>Your data</h3>
            <div className="data-list">
              <button onClick={downloadBackup}><Download size={16} /><span><b>Download backup</b><small>Save employees and settings as a file</small></span></button>
              <button onClick={() => restoreRef.current?.click()}><Upload size={16} /><span><b>Restore backup</b><small>Replace current data from a backup file</small></span></button>
              <button onClick={() => importRef.current?.click()}><FileSpreadsheet size={16} /><span><b>Import from Excel or CSV</b><small>Columns: Name, Salary, Hour, OT Hour</small></span></button>
              <button onClick={() => { exportCSV(employees, settings, period); setNotice('CSV downloaded.'); }}><FileText size={16} /><span><b>Download CSV</b><small>Plain spreadsheet file</small></span></button>
            </div>
            <div className="dialog-actions"><button className="btn gold" onClick={() => setShowSettings(false)}>Done</button></div>
          </div>
        </div>
      )}

      <input ref={restoreRef} type="file" accept=".json" hidden onChange={restoreBackup} />
      <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={importFile} />
      {notice && <div className="toast"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Close"><X size={14} /></button></div>}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', className = '', ...props }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} {...props} />
    </label>
  );
}
