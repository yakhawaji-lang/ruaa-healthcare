import { useEffect, useMemo, useRef, useState } from 'react';
import { Columns3, ChevronUp, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Eye } from 'lucide-react';
import { useLang } from '../i18n.jsx';

// Admin data table with per-user column control: show / hide, reorder and sort.
// Choices are remembered per table in this browser (localStorage, best-effort).
//
// columns: [{ key, label, render?(row), value?(row) (for sorting), default?: bool (shown by default, true if omitted),
//             required?: bool (cannot be hidden), dir?: 'ltr'|'auto', nowrap?: bool, sortable?: bool (default true) }]

const T = {
  ar: { columns: 'الأعمدة', show_all: 'إظهار الكل', reset: 'الافتراضي', up: 'تحريك لأعلى', down: 'تحريك لأسفل', shown: (a, b) => `${a} من ${b} ظاهرة`, sort: 'ترتيب' },
  en: { columns: 'Columns', show_all: 'Show all', reset: 'Default', up: 'Move up', down: 'Move down', shown: (a, b) => `${a} of ${b} shown`, sort: 'Sort' },
};

const KEY = (id) => `rumd.table.${id}.v1`;
const load = (id) => { try { return JSON.parse(localStorage.getItem(KEY(id)) || 'null'); } catch { return null; } };
const save = (id, v) => { try { localStorage.setItem(KEY(id), JSON.stringify(v)); } catch {} };

const defaultsOf = (columns) => ({
  order: columns.map((c) => c.key),
  hidden: columns.filter((c) => c.default === false).map((c) => c.key),
  sort: null,
});

const cmp = (a, b) => {
  if (a == null || a === '') return 1;
  if (b == null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

export function useColumnPrefs(id, columns) {
  const [prefs, setPrefs] = useState(() => {
    const d = defaultsOf(columns);
    const s = load(id);
    if (!s) return d;
    // keep stored order, append columns added since, drop ones that no longer exist
    const known = new Set(columns.map((c) => c.key));
    const order = [...(s.order || []).filter((k) => known.has(k)), ...d.order.filter((k) => !(s.order || []).includes(k))];
    const newCols = d.order.filter((k) => !(s.order || []).includes(k));
    const hidden = [...(s.hidden || []).filter((k) => known.has(k)), ...d.hidden.filter((k) => newCols.includes(k))];
    return { order, hidden, sort: s.sort && known.has(s.sort.key) ? s.sort : null };
  });
  useEffect(() => { save(id, prefs); }, [id, prefs]);
  return [prefs, setPrefs, () => setPrefs(defaultsOf(columns))];
}

export default function DataTable({ id, columns, rows, rowKey = (r) => r.id, rowClass, onRowClick, actions, toolbar, empty, className = '' }) {
  const { lang } = useLang();
  const tt = T[lang] || T.ar;
  const [prefs, setPrefs, reset] = useColumnPrefs(id, columns);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const byKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);
  const ordered = prefs.order.map((k) => byKey[k]).filter(Boolean);
  const visible = ordered.filter((c) => c.required || !prefs.hidden.includes(c.key));

  const sorted = useMemo(() => {
    const s = prefs.sort;
    const col = s && byKey[s.key];
    if (!col) return rows;
    const val = col.value || ((r) => r[col.key]);
    const out = [...rows].sort((a, b) => cmp(val(a), val(b)));
    return s.dir === 'desc' ? out.reverse() : out;
  }, [rows, prefs.sort, byKey]);

  const toggle = (k) => setPrefs((p) => ({ ...p, hidden: p.hidden.includes(k) ? p.hidden.filter((x) => x !== k) : [...p.hidden, k] }));
  const move = (k, d) => setPrefs((p) => {
    const o = [...p.order]; const i = o.indexOf(k); const j = i + d;
    if (i < 0 || j < 0 || j >= o.length) return p;
    [o[i], o[j]] = [o[j], o[i]];
    return { ...p, order: o };
  });
  const sortBy = (c) => {
    if (c.sortable === false) return;
    setPrefs((p) => {
      const s = p.sort;
      if (!s || s.key !== c.key) return { ...p, sort: { key: c.key, dir: 'asc' } };
      if (s.dir === 'asc') return { ...p, sort: { key: c.key, dir: 'desc' } };
      return { ...p, sort: null };
    });
  };

  return (
    <div className={`dt ${className}`}>
      <div className="dt-bar">
        {toolbar}
        <div className="dt-cols" ref={boxRef}>
          <button type="button" className={`btn btn-outline btn-sm dt-cols-btn ${open ? 'on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <Columns3 size={15} /> {tt.columns} <span className="dt-count">{visible.length}/{columns.length}</span>
          </button>
          {open && (
            <div className="dt-menu" role="dialog">
              <div className="dt-menu-head">
                <strong>{tt.columns}</strong>
                <small>{tt.shown(visible.length, columns.length)}</small>
              </div>
              <div className="dt-menu-list">
                {ordered.map((c, i) => {
                  const on = c.required || !prefs.hidden.includes(c.key);
                  return (
                    <div key={c.key} className={`dt-menu-row ${on ? '' : 'off'}`}>
                      <label>
                        <input type="checkbox" checked={on} disabled={c.required} onChange={() => toggle(c.key)} />
                        <span>{c.menuLabel || c.label}</span>
                      </label>
                      <span className="dt-move">
                        <button type="button" disabled={i === 0} onClick={() => move(c.key, -1)} title={tt.up} aria-label={tt.up}><ChevronUp size={14} /></button>
                        <button type="button" disabled={i === ordered.length - 1} onClick={() => move(c.key, 1)} title={tt.down} aria-label={tt.down}><ChevronDown size={14} /></button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="dt-menu-foot">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPrefs((p) => ({ ...p, hidden: [] }))}><Eye size={14} /> {tt.show_all}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={14} /> {tt.reset}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 ? (empty || null) : (
        <div className="dt-scroll">
          <table className="admin-table dt-table">
            <thead>
              <tr>
                {visible.map((c) => {
                  const s = prefs.sort?.key === c.key ? prefs.sort.dir : null;
                  const Icon = s === 'asc' ? ArrowUp : s === 'desc' ? ArrowDown : ArrowUpDown;
                  return (
                    <th key={c.key} className={c.sortable === false ? '' : 'dt-sortable'} onClick={() => sortBy(c)} aria-sort={s ? (s === 'asc' ? 'ascending' : 'descending') : undefined}>
                      <span>{c.label}</span>{c.sortable !== false && <Icon size={12} className={`dt-sort-ico ${s ? 'on' : ''}`} />}
                    </th>
                  );
                })}
                {actions && <th className="dt-actions-th" />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={rowKey(r)} className={`${onRowClick ? 'clickable' : ''} ${rowClass ? rowClass(r) || '' : ''}`} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                  {visible.map((c) => (
                    <td key={c.key} dir={c.dir} className={`${c.nowrap ? 'nowrap' : ''} ${c.wide ? 'wide' : ''}`}>
                      {c.render ? c.render(r) : (r[c.key] ?? '—')}
                    </td>
                  ))}
                  {actions && <td className="row-actions" onClick={(e) => e.stopPropagation()}>{actions(r)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
