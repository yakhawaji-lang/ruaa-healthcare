// Shared input validation for the whole app.
// Saudi mobile rule: exactly 10 digits starting with 05.
export const SA_PHONE_RE = /^05\d{8}$/;

export const isSaudiMobile = (v) => SA_PHONE_RE.test(String(v ?? '').trim());

// keep only digits, cap at 10 chars — use in phone <input> onChange
export const digits10 = (v) => String(v ?? '').replace(/\D/g, '').slice(0, 10);

export const phoneError = (lang = 'ar') =>
  lang === 'en'
    ? 'Mobile number must be 10 digits starting with 05.'
    : 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05.';

// Standard props to spread on a phone <input> for consistent UX everywhere.
export const phoneInputProps = { type: 'tel', dir: 'ltr', inputMode: 'numeric', maxLength: 10, placeholder: '05XXXXXXXX' };
