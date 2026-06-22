import { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Workflow } from 'lucide-react';
import { AdminAPI } from '../storage/api.js';
import { StatusPill } from '../account/Tracking.jsx';
import { REQUEST_WORKFLOW, CASE_WORKFLOW, isTerminal, wfLabel, wfHint } from './workflow.js';
import { useLang } from '../i18n.jsx';

const T = {
  ar: {
    set_price_first: 'حدّد السعر قبل الموافقة.', workflow: 'سير العمل',
    current_stage: 'المرحلة الحالية:', all_done: 'اكتملت جميع المراحل.',
    cancelled: 'تم إلغاء الطلب.', rejected: 'تم رفض الحالة.',
    price_label: 'السعر (ر.س) — يُعرض للعميل', price_ph: 'مثال: 300',
    note_label: 'ملاحظة للعميل (اختياري) — تُضاف لسجل المتابعة',
    note_ph: 'مثال: سيتواصل معك الفريق لتأكيد الموعد', confirm: 'تأكيد؟',
  },
  en: {
    set_price_first: 'Set the price before approving.', workflow: 'Workflow',
    current_stage: 'Current stage:', all_done: 'All stages completed.',
    cancelled: 'The request was cancelled.', rejected: 'The case was rejected.',
    price_label: 'Price (SAR) — shown to the client', price_ph: 'e.g. 300',
    note_label: 'Note for the client (optional) — added to the tracking log',
    note_ph: 'e.g. The team will contact you to confirm the appointment', confirm: 'Confirm?',
  },
};

// Action-driven status progression. Replaces the manual status dropdown:
// the admin advances the request/case stage-by-stage, optionally setting a
// price (on approval) and a note, which is recorded on the tracking timeline.
export default function WorkflowPanel({ kind, id, status, price, onDone }) {
  const { lang } = useLang();
  const tt = T[lang];
  const config = kind === 'request' ? REQUEST_WORKFLOW : CASE_WORKFLOW;
  const update = kind === 'request' ? AdminAPI.updateRequest : AdminAPI.updateCase;
  const step = config[status];
  const [note, setNote] = useState('');
  const [priceVal, setPriceVal] = useState(price ?? '');
  const [busy, setBusy] = useState(false);

  const advance = async (action) => {
    if (action.price && (priceVal === '' || Number(priceVal) <= 0)) { alert(tt.set_price_first); return; }
    setBusy(true);
    try {
      const payload = { status: action.to, event_title: action.event, note: note || null };
      if (kind === 'request') payload.price = action.price ? Number(priceVal) : (price ?? null);
      await update(id, payload);
      setNote('');
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <div className="wf-panel">
      <div className="wf-head">
        <span className="wf-label"><Workflow size={16} /> {tt.workflow}</span>
        <span className="wf-current">{tt.current_stage} <StatusPill status={status} /></span>
      </div>

      {isTerminal(status) || !step ? (
        <div className={`wf-done ${status}`}>
          {status === 'completed'
            ? <><CheckCircle2 size={20} /> {tt.all_done}</>
            : <><XCircle size={20} /> {status === 'cancelled' ? tt.cancelled : tt.rejected}</>}
        </div>
      ) : (
        <div className="wf-actions">
          {step.primary.price && (
            <div className="field wf-price">
              <label>{tt.price_label}</label>
              <input type="number" dir="ltr" value={priceVal} onChange={(e) => setPriceVal(e.target.value)} placeholder={tt.price_ph} />
            </div>
          )}
          {wfHint(step.primary, lang) && <p className="wf-hint">{wfHint(step.primary, lang)}</p>}
          <div className="field">
            <label>{tt.note_label}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={tt.note_ph} />
          </div>
          <div className="wf-btns">
            <button className="btn btn-primary" disabled={busy} onClick={() => advance(step.primary)}>
              {wfLabel(step.primary, lang)} <ArrowLeft size={16} />
            </button>
            {step.secondary && (
              <button className="btn wf-danger" disabled={busy} onClick={() => { if (confirm(tt.confirm)) advance(step.secondary); }}>
                {wfLabel(step.secondary, lang)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
