// Labels for table columns added by the column chooser (shared across admin tables).
import { useLang } from '../i18n.jsx';

const L = {
  ar: {
    created: 'تاريخ الإنشاء', updated: 'آخر تحديث', email: 'البريد', phone: 'الجوال', contact_name: 'اسم المسؤول',
    cases: 'الحالات', open_cases: 'حالات مفتوحة', last_case: 'آخر حالة', members: 'المستخدمون', requests: 'الطلبات', last_request: 'آخر طلب',
    patient: 'المريض', city: 'المدينة', preferred: 'التاريخ المفضّل', notes: 'ملاحظات', price: 'السعر', discount: 'الخصم', promo: 'كود الخصم',
    visits: 'الزيارات', next: 'القادمة', client: 'العميل', specialty: 'التخصص', duration: 'المدة (د)', complaint: 'الشكوى', source: 'المصدر',
    organization: 'الجهة', license: 'رقم الترخيص', contract: 'فترة التعاقد', slot: 'مدة الاستشارة', self_booking: 'الحجز الذاتي',
    uses: 'مرات الاستخدام', image: 'الصورة', slug: 'الرابط', order: 'الترتيب', perms: 'الصلاحيات', all_pages: 'كل الصفحات', pages_n: (n) => `${n} صفحة`,
    yes: 'نعم', no: 'لا', min: 'د', sar: 'ر.س',
  },
  en: {
    created: 'Created', updated: 'Last update', email: 'Email', phone: 'Mobile', contact_name: 'Contact name',
    cases: 'Cases', open_cases: 'Open cases', last_case: 'Last case', members: 'Users', requests: 'Requests', last_request: 'Last request',
    patient: 'Patient', city: 'City', preferred: 'Preferred date', notes: 'Notes', price: 'Price', discount: 'Discount', promo: 'Promo code',
    visits: 'Visits', next: 'next', client: 'Client', specialty: 'Specialty', duration: 'Length (min)', complaint: 'Complaint', source: 'Source',
    organization: 'Organization', license: 'License no.', contract: 'Contract period', slot: 'Consultation length', self_booking: 'Self-booking',
    uses: 'Times used', image: 'Image', slug: 'Slug', order: 'Order', perms: 'Permissions', all_pages: 'All pages', pages_n: (n) => `${n} pages`,
    yes: 'Yes', no: 'No', min: 'min', sar: 'SAR',
  },
};
export const useColLabels = () => { const { lang } = useLang(); return L[lang] || L.ar; };
