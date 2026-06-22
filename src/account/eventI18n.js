// Tracking-timeline events are generated server-side in Arabic (title/note/actor).
// This module translates the known system-generated phrases to English at render
// time, so the timeline reads correctly on English pages — including past events.

const TITLE_EN = {
  // creation
  'تم استلام الطلب': 'Request received',
  'تم استلام الحالة': 'Case received',
  'تم تعديل بيانات الحالة': 'Case details updated',
  // visits / accounts
  'تم جدولة زيارة منزلية': 'Home visit scheduled',
  'تم إنشاء حساب المريض': 'Patient account created',
  'تم ربط حساب المريض': 'Patient account linked',
  // request workflow events
  'بدأت مراجعة الطلب': 'Request review started',
  'تم إلغاء الطلب': 'Request cancelled',
  'تمت الموافقة على الطلب وتحديد السعر': 'Request approved and price set',
  'بدأ تنفيذ الخدمة': 'Service delivery started',
  'تم إكمال الخدمة بنجاح': 'Service completed successfully',
  // case workflow events
  'بدأت المراجعة الطبية للحالة': 'Medical review started',
  'تم رفض الحالة': 'Case rejected',
  'تم اعتماد الحالة طبيًا': 'Case medically approved',
  'تم تحديد جدولة الزيارة': 'Visit scheduling confirmed',
  'بدأ تنفيذ الرعاية': 'Care delivery started',
  'تم إكمال الحالة بنجاح': 'Case completed successfully',
  // visit status change labels
  'تمت': 'Completed',
  'ملغاة': 'Cancelled',
  'مجدولة': 'Scheduled',
};

const ACTOR_EN = {
  'النظام': 'System',
  'الإدارة': 'Administration',
};

const VISIT_TYPE_EN = {
  'زيارة منزلية': 'Home visit',
  'تقييم أولي': 'Initial assessment',
  'متابعة': 'Follow-up',
  'إجراء طبي': 'Medical procedure',
  'سحب عينات': 'Sample collection',
};

function translateNote(note) {
  if (!note) return '';
  const n = note.trim();

  // request creation
  if (n === 'تم استلام طلبك بنجاح وسيُراجَع من قبل فريق رؤى.')
    return 'Your request was received successfully and will be reviewed by the RU-MD team.';

  // case creation (optional attachments count)
  let m = n.match(/^تم استلام بيانات المريض( مع (\d+) مرفق)? وستُحوَّل للمراجعة الطبية\.?$/);
  if (m) return `The patient information was received${m[2] ? ` with ${m[2]} attachment(s)` : ''} and will be forwarded for medical review.`;

  // patient account note
  m = n.match(/^اسم المستخدم \(الجوال\):\s*(.+?)\s*—\s*كلمة المرور: رقم هوية المريض$/);
  if (m) return `Username (mobile): ${m[1]} — Password: the patient's ID number`;

  // visit note: "<type> بتاريخ <date> — <clinician>"
  let out = n;
  for (const [ar, en] of Object.entries(VISIT_TYPE_EN)) {
    if (out.startsWith(ar)) { out = en + out.slice(ar.length); break; }
  }
  out = out.replace(' بتاريخ ', ' on ');
  return out;
}

// Returns { title, note, actor } in the requested language.
export function localizeEvent(e, lang = 'ar') {
  if (lang !== 'en') {
    return { title: e.title_ar || e.title || '', note: e.note || '', actor: e.actor || '' };
  }
  const rawTitle = (e.title_ar || e.title || '').trim();
  return {
    title: TITLE_EN[rawTitle] || e.title_en || '',
    note: translateNote(e.note),
    actor: ACTOR_EN[(e.actor || '').trim()] || e.actor || '',
  };
}
