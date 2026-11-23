import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    title: 'استيراد حالات من Excel', step1: 'تحميل النموذج', step2: 'رفع الملف', step3: 'المعاينة والتأكيد',
    insurer: 'شركة التأمين', choose_insurer: 'اختر شركة التأمين', status: 'مرحلة الحالات بعد الاستيراد',
    st_new: 'جديدة', st_new_hint: 'تدخل كأي حالة واردة وتمر بالمراجعة الطبية.',
    st_approved: 'معتمدة مباشرة', st_approved_hint: 'تُعتمد فورًا ويُنشأ حساب المريض في البوابة (الجوال + رقم الهوية).',
    tpl_hint: 'حمّل النموذج الفارغ، عبّئه (صف لكل مريض)، ثم ارفعه هنا.', download: 'تحميل نموذج Excel',
    drop: 'اختر ملف Excel (.xlsx) أو اسحبه هنا', reading: 'جارٍ قراءة الملف...', change_file: 'ملف آخر',
    rows: (n) => `${n} صف في الملف`, ready: 'جاهزة', warn: 'بملاحظات', bad: 'مرفوضة',
    col_n: 'الصف', col_patient: 'المريض', col_nid: 'الهوية', col_mobile: 'الجوال', col_service: 'الخدمة', col_notes: 'ملاحظات',
    import_n: (n) => `استيراد ${n} حالة`, importing: 'جارٍ الاستيراد...', back: 'رجوع', cancel: 'إلغاء', close: 'إغلاق',
    done_title: (n) => `تم استيراد ${n} حالة`, skipped: (n) => `تم تجاوز ${n} صف`, accounts: (n) => `أُنشئ/رُبط ${n} حساب مريض`,
    select_all: 'تحديد الكل', none_selected: 'اختر صفًا واحدًا على الأقل',
    msg: {
      patient_name_required: 'اسم المريض مطلوب', national_id_format: 'رقم الهوية ليس 10 أرقام', national_id_missing: 'بدون رقم هوية',
      mobile_missing: 'بدون جوال', mobile_format: 'الجوال ليس 05xxxxxxxx', dob_format: 'تاريخ الميلاد غير صحيح',
      service_not_listed: 'خدمة غير موجودة بالقائمة', open_case_exists: (r) => `للمريض حالة مفتوحة ${r || ''}`, duplicate_in_file: 'مكرر في الملف',
    },
    err: { bad_file: 'تعذّرت قراءة الملف. تأكد أنه بصيغة .xlsx', empty_file: 'الملف فارغ', too_many_rows: (m) => `الملف يتجاوز الحد (${m} صف)`, insurer_required: 'اختر شركة التأمين أولًا', failed: 'تعذّر إكمال العملية' },
  },
  en: {
    title: 'Import cases from Excel', step1: 'Download template', step2: 'Upload file', step3: 'Review & confirm',
    insurer: 'Insurance company', choose_insurer: 'Choose the insurance company', status: 'Stage after import',
    st_new: 'New', st_new_hint: 'Arrives like any incoming case and goes through medical review.',
    st_approved: 'Approved directly', st_approved_hint: 'Approved at once and the patient portal account is created (mobile + national ID).',
    tpl_hint: 'Download the blank template, fill one row per patient, then upload it here.', download: 'Download Excel template',
    drop: 'Choose an Excel file (.xlsx) or drop it here', reading: 'Reading the file...', change_file: 'Another file',
    rows: (n) => `${n} rows in the file`, ready: 'Ready', warn: 'With notes', bad: 'Rejected',
    col_n: 'Row', col_patient: 'Patient', col_nid: 'ID', col_mobile: 'Mobile', col_service: 'Service', col_notes: 'Notes',
    import_n: (n) => `Import ${n} case${n === 1 ? '' : 's'}`, importing: 'Importing...', back: 'Back', cancel: 'Cancel', close: 'Close',
    done_title: (n) => `${n} case${n === 1 ? '' : 's'} imported`, skipped: (n) => `${n} row(s) skipped`, accounts: (n) => `${n} patient account(s) created/linked`,
    select_all: 'Select all', none_selected: 'Select at least one row',
    msg: {
      patient_name_required: 'Patient name required', national_id_format: 'ID is not 10 digits', national_id_missing: 'No national ID',
      mobile_missing: 'No mobile', mobile_format: 'Mobile is not 05xxxxxxxx', dob_format: 'Invalid date of birth',
      service_not_listed: 'Service not in the list', open_case_exists: (r) => `Patient has an open case ${r || ''}`, duplicate_in_file: 'Duplicate in file',
    },
    err: { bad_file: 'Could not read the file. Make sure it is .xlsx', empty_file: 'The file is empty', too_many_rows: (m) => `File exceeds the limit (${m} rows)`, insurer_required: 'Choose the insurance company first', failed: 'Could not complete' },
  },
};

const readAsBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.onerror = rej;
  r.readAsDataURL(file);
});
const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * mode="admin":   props.insurers [{id,name}], api = { template(insurerId), preview(insurerId,file), run(insurerId,rows,status) }
 * mode="insurer": api = { template(), preview(file), run(rows) }
 */
export default function ExcelImportModal({ mode = 'insurer', api, insurers = [], defaultInsurer = '', onClose, onDone }) {
  const { lang } = useLang();
  const tt = T[lang] || T.ar;
  const isAdmin = mode === 'admin';
  const [insurer, setInsurer] = useState(defaultInsurer ? String(defaultInsurer) : '');
  const [status, setStatus] = useState('submitted');
  const [preview, setPreview] = useState(null);       // { rows, services }
  const [fileName, setFileName] = useState('');
  const [picked, setPicked] = useState({});           // row n -> include?
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { setPreview(null); setFileName(''); }, [insurer]);

  const errText = (e) => {
    const d = e?.response?.data || {};
    const f = tt.err[d.error];
    return typeof f === 'function' ? f(d.max) : f || tt.err.failed;
  };

  const downloadTpl = async () => {
    setError(''); setBusy('tpl');
    try { saveBlob(await (isAdmin ? api.template(insurer) : api.template()), 'RU-MD-cases-template.xlsx'); }
    catch (e) { setError(tt.err.failed); }
    finally { setBusy(''); }
  };

  const onFile = async (file) => {
    if (!file) return;
    if (isAdmin && !insurer) { setError(tt.err.insurer_required); return; }
    setError(''); setBusy('read'); setFileName(file.name);
    try {
      const b64 = await readAsBase64(file);
      const p = isAdmin ? await api.preview(insurer, b64) : await api.preview(b64);
      setPreview(p);
      const sel = {};
      for (const r of p.rows) sel[r.n] = r.errors.length === 0 && !r.duplicate;
      setPicked(sel);
    } catch (e) { setError(errText(e)); setPreview(null); }
    finally { setBusy(''); if (inputRef.current) inputRef.current.value = ''; }
  };

  const rows = preview?.rows || [];
  const counts = useMemo(() => ({
    ok: rows.filter((r) => !r.errors.length && !r.warnings.length).length,
    warn: rows.filter((r) => !r.errors.length && r.warnings.length).length,
    bad: rows.filter((r) => r.errors.length).length,
  }), [rows]);
  const selectable = rows.filter((r) => !r.errors.length);
  const selected = selectable.filter((r) => picked[r.n]);
  const allOn = selectable.length > 0 && selected.length === selectable.length;

  const run = async () => {
    if (!selected.length) { setError(tt.none_selected); return; }
    setError(''); setBusy('run');
    const payload = selected.map((r) => ({ n: r.n, ...r.data }));
    try {
      const r = isAdmin ? await api.run(insurer, payload, status) : await api.run(payload);
      setResult(r);
      onDone?.(r);
    } catch (e) { setError(errText(e)); }
    finally { setBusy(''); }
  };

  const msg = (code, r) => { const f = tt.msg[code]; return typeof f === 'function' ? f(r.duplicate) : f || code; };
  const Arrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="modal wide-modal xl-import" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2><FileSpreadsheet size={20} style={{ verticalAlign: '-4px' }} /> {tt.title}</h2>
          <button onClick={onClose} disabled={!!busy}><X size={20} /></button>
        </div>

        {result ? (
          <div className="modal-body success-box">
            <CheckCircle2 size={48} className="success-icon" />
            <h3>{tt.done_title(result.created.length)}</h3>
            {result.skipped?.length > 0 && <p className="muted">{tt.skipped(result.skipped.length)}</p>}
            {result.created.some((c) => c.account) && <p className="muted">{tt.accounts(result.created.filter((c) => c.account).length)}</p>}
            <div className="xl-refs" dir="ltr">{result.created.slice(0, 40).map((c) => <span key={c.id}>{c.ref}</span>)}{result.created.length > 40 && <span>…</span>}</div>
            <button className="btn btn-primary" onClick={onClose}>{tt.close}</button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              {error && <div className="form-alert error">{error}</div>}

              {!preview && (
                <>
                  {isAdmin && (
                    <div className="xl-setup">
                      <div className="field">
                        <label>{tt.insurer}</label>
                        <select value={insurer} onChange={(e) => setInsurer(e.target.value)}>
                          <option value="">{tt.choose_insurer}</option>
                          {insurers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>{tt.status}</label>
                        <div className="xl-status">
                          {[['submitted', tt.st_new, tt.st_new_hint], ['approved', tt.st_approved, tt.st_approved_hint]].map(([v, l, h]) => (
                            <label key={v} className={`xl-status-opt ${status === v ? 'on' : ''}`}>
                              <input type="radio" name="xl-status" checked={status === v} onChange={() => setStatus(v)} />
                              <span><b>{l}</b><small>{h}</small></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="xl-step">
                    <span className="xl-num">1</span>
                    <div>
                      <strong>{tt.step1}</strong>
                      <p className="muted">{tt.tpl_hint}</p>
                      <button type="button" className="btn btn-outline btn-sm" onClick={downloadTpl} disabled={busy === 'tpl'}><Download size={15} /> {tt.download}</button>
                    </div>
                  </div>

                  <div className="xl-step">
                    <span className="xl-num">2</span>
                    <div style={{ flex: 1 }}>
                      <strong>{tt.step2}</strong>
                      <label
                        className={`xl-drop ${drag ? 'drag' : ''} ${isAdmin && !insurer ? 'disabled' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
                      >
                        <Upload size={22} />
                        <span>{busy === 'read' ? tt.reading : tt.drop}</span>
                        <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden
                          disabled={busy === 'read' || (isAdmin && !insurer)} onChange={(e) => onFile(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {preview && (
                <>
                  <div className="xl-summary">
                    <span className="xl-file"><FileSpreadsheet size={15} /> {fileName} · {tt.rows(rows.length)}</span>
                    <span className="xl-chip ok"><CheckCircle2 size={13} /> {tt.ready} {counts.ok}</span>
                    <span className="xl-chip warn"><AlertTriangle size={13} /> {tt.warn} {counts.warn}</span>
                    <span className="xl-chip bad"><XCircle size={13} /> {tt.bad} {counts.bad}</span>
                    {isAdmin && <span className="xl-chip">{insurers.find((i) => String(i.id) === String(insurer))?.name} · {status === 'approved' ? tt.st_approved : tt.st_new}</span>}
                  </div>
                  <div className="xl-table-wrap">
                    <table className="admin-table xl-table">
                      <thead>
                        <tr>
                          <th><input type="checkbox" checked={allOn} title={tt.select_all}
                            onChange={(e) => setPicked((p) => { const n = { ...p }; selectable.forEach((r) => { n[r.n] = e.target.checked; }); return n; })} /></th>
                          <th>{tt.col_n}</th><th>{tt.col_patient}</th><th>{tt.col_nid}</th><th>{tt.col_mobile}</th><th>{tt.col_service}</th><th>{tt.col_notes}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const bad = r.errors.length > 0;
                          return (
                            <tr key={r.n} className={bad ? 'xl-bad' : r.warnings.length ? 'xl-warn' : ''}>
                              <td><input type="checkbox" disabled={bad} checked={!bad && !!picked[r.n]} onChange={(e) => setPicked((p) => ({ ...p, [r.n]: e.target.checked }))} /></td>
                              <td dir="ltr">{r.n}</td>
                              <td>{r.data.patient_name || '—'}</td>
                              <td dir="ltr">{r.data.national_id || '—'}</td>
                              <td dir="ltr">{r.data.mobile || '—'}</td>
                              <td>{r.data.requested_service || '—'}</td>
                              <td>
                                {r.errors.map((c) => <span key={c} className="xl-note bad">{msg(c, r)}</span>)}
                                {r.warnings.map((c) => <span key={c} className="xl-note warn">{msg(c, r)}</span>)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-foot">
              {preview ? (
                <>
                  <button className="btn btn-ghost" onClick={() => { setPreview(null); setError(''); }} disabled={!!busy}><Arrow size={15} /> {tt.change_file}</button>
                  <button className="btn btn-primary" onClick={run} disabled={!!busy || !selected.length}>{busy === 'run' ? tt.importing : tt.import_n(selected.length)}</button>
                </>
              ) : (
                <button className="btn btn-ghost" onClick={onClose}>{tt.cancel}</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
