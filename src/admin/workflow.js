// Guided workflow: each stage exposes the next action(s) instead of a free
// status dropdown. Advancing records a timeline event automatically.
// `label`/`hint` are UI strings (ar + _en). `event` is the audit-log record.

export const REQUEST_WORKFLOW = {
  pending: {
    primary: { to: 'reviewing', label: 'بدء المراجعة', label_en: 'Start review', event: 'بدأت مراجعة الطلب' },
    secondary: { to: 'cancelled', label: 'إلغاء الطلب', label_en: 'Cancel request', danger: true, event: 'تم إلغاء الطلب' },
  },
  reviewing: {
    primary: { to: 'approved', label: 'الموافقة وتحديد السعر', label_en: 'Approve & set price', event: 'تمت الموافقة على الطلب وتحديد السعر', price: true },
    secondary: { to: 'cancelled', label: 'إلغاء الطلب', label_en: 'Cancel request', danger: true, event: 'تم إلغاء الطلب' },
  },
  approved: {
    primary: { to: 'scheduled', label: 'تأكيد جدولة الزيارة', label_en: 'Confirm visit scheduling', event: 'تم تحديد جدولة الزيارة', hint: 'أضف تفاصيل الزيارة من «الزيارات المنزلية» بالأسفل.', hint_en: 'Add the visit details from "Home Visits" below.' },
  },
  scheduled: {
    primary: { to: 'in_progress', label: 'بدء التنفيذ', label_en: 'Start service', event: 'بدأ تنفيذ الخدمة' },
  },
  in_progress: {
    primary: { to: 'completed', label: 'إكمال الخدمة', label_en: 'Complete service', event: 'تم إكمال الخدمة بنجاح' },
  },
};

export const CASE_WORKFLOW = {
  submitted: {
    primary: { to: 'reviewing', label: 'بدء المراجعة الطبية', label_en: 'Start medical review', event: 'بدأت المراجعة الطبية للحالة' },
    secondary: { to: 'rejected', label: 'رفض الحالة', label_en: 'Reject case', danger: true, event: 'تم رفض الحالة' },
  },
  reviewing: {
    primary: { to: 'approved', label: 'اعتماد الحالة', label_en: 'Approve case', event: 'تم اعتماد الحالة طبيًا' },
    secondary: { to: 'rejected', label: 'رفض الحالة', label_en: 'Reject case', danger: true, event: 'تم رفض الحالة' },
  },
  approved: {
    primary: { to: 'visit_scheduled', label: 'تأكيد جدولة الزيارة', label_en: 'Confirm visit scheduling', event: 'تم تحديد جدولة الزيارة', hint: 'أضف تفاصيل الزيارة من «الزيارات المنزلية» بالأسفل.', hint_en: 'Add the visit details from "Home Visits" below.' },
  },
  visit_scheduled: {
    primary: { to: 'in_progress', label: 'بدء تنفيذ الرعاية', label_en: 'Start care delivery', event: 'بدأ تنفيذ الرعاية' },
  },
  in_progress: {
    primary: { to: 'completed', label: 'إكمال الحالة', label_en: 'Complete case', event: 'تم إكمال الحالة بنجاح' },
  },
};

// Pick the right-language label/hint from a workflow action.
export const wfLabel = (action, lang = 'ar') => (lang === 'en' ? (action?.label_en || action?.label) : action?.label) || '';
export const wfHint = (action, lang = 'ar') => (lang === 'en' ? (action?.hint_en || action?.hint) : action?.hint) || '';

export const isTerminal = (status) => ['completed', 'cancelled', 'rejected'].includes(status);
