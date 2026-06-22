# رؤى للرعاية الصحية المنزلية — RU-MD Home Healthcare

موقع ثنائي اللغة (عربي/إنجليزي) مع لوحة تحكم كاملة، مبني بنفس تقنيات **PlayTix 2.0**:
React 18 + Vite للواجهة، Express (Node.js) لواجهة REST، وقاعدة بيانات MySQL.

A bilingual (Arabic/English, RTL/LTR) website with a full admin dashboard, rebuilt
from the original WordPress site on the **PlayTix 2.0 stack**: React 18 + Vite front-end,
an Express (Node.js) REST API, and a MySQL database.

---

## ✨ المزايا / Features

- **واجهة عامة عصرية**: الرئيسية، من نحن، الخدمات (14 خدمة طبية)، صفحة الخدمة، تواصل معنا.
- **ثنائية اللغة بالكامل** مع تبديل فوري بين العربية (RTL) والإنجليزية (LTR) — وحدة ترجمة مركزية `src/translations.js`.
- **لوحة تحكم** (`/admin`) محمية بتسجيل دخول (bcrypt + JWT):
  - لوحة إحصائيات.
  - إدارة الخدمات (إضافة/تعديل/حذف) بمحرر ثنائي اللغة.
  - إدارة الصفحات والمحتوى (تحرير نصوص الرئيسية و«من نحن»).
  - صندوق رسائل التواصل/طلبات الخدمة مع الرد عبر واتساب.
  - إعدادات الموقع (الهاتف، العنوان، أوقات العمل، السوشيال…).
- **فرض الأرقام اللاتينية** على حقول الإدخال (نفس سلوك PlayTix).
- نظام **هجرات (migrations)** + **حذف منطقي (soft delete)** + **سجل تدقيق (audit log)**.

---

## 🧱 البنية / Project structure

```
ruaa-healthcare/
├── index.html              # نقطة دخول Vite
├── vite.config.js
├── package.json            # الواجهة (React/Vite)
├── src/
│   ├── main.jsx            # تمهيد + فرض الأرقام اللاتينية
│   ├── App.jsx             # التوجيه + جلب بيانات الموقع
│   ├── translations.js     # وحدة الترجمة المركزية (ar/en)
│   ├── i18n.jsx            # سياق اللغة + RTL/LTR
│   ├── storage/api.js      # طبقة الاتصال بالـ API (axios)
│   ├── components/         # Navbar, Footer, Logo, ...
│   ├── pages/              # Home, About, Services, ServiceDetail, Contact
│   └── admin/              # لوحة التحكم بالكامل
└── server/
    ├── index.js            # خادم Express + المسارات
    ├── auth.js             # JWT middleware
    ├── package.json        # تبعيات الخادم
    ├── .env.example
    ├── routes/             # public, auth, admin
    └── db/
        ├── pool.js         # طبقة تجريد القاعدة (mysql2)
        ├── queries.js      # كل استعلامات SQL
        ├── migrate.js      # مشغّل الهجرات
        ├── seedRun.js      # تعبئة البيانات
        ├── migrations/     # 001_init.sql
        └── seed/content.json  # المحتوى المستخرج من الموقع القديم
```

---

## 🚀 التشغيل محليًا مع XAMPP / Local setup with XAMPP

### 1. المتطلبات
- Node.js 18+ (مثبت لديك 22 ✓)
- MySQL — عبر **XAMPP** (شغّل MySQL من لوحة تحكم XAMPP).

### 2. إعداد قاعدة البيانات والخادم
```bash
cd server
copy .env.example .env        # ثم عدّل القيم إذا لزم (Windows)
# على ماك/لينكس: cp .env.example .env

npm install                   # تثبيت تبعيات الخادم
npm run setup                 # ينشئ القاعدة + الجداول + يعبّئ المحتوى وحساب المدير
npm start                     # يشغّل الـ API على http://localhost:4000
```

> إعدادات XAMPP الافتراضية تعمل مباشرة: `DB_USER=root` وكلمة مرور فارغة.
> سيُنشئ السكربت قاعدة باسم `ruaa_healthcare` تلقائيًا (ترميز utf8mb4).

### 3. تشغيل الواجهة (في نافذة طرفية ثانية)
```bash
# من جذر المشروع
npm install
npm run dev                   # http://localhost:5173
```

الواجهة تمرّر طلبات `/api` تلقائيًا إلى الخادم على المنفذ 4000.

### 4. الدخول للوحة التحكم
افتح **http://localhost:5173/admin**

```
البريد:    admin@rumd.me
كلمة المرور: Admin@12345
```
> غيّرهما من ملف `server/.env` قبل أول تشغيل (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

---

## 📦 النشر للإنتاج / Production build

```bash
npm run build                 # ينتج مجلد dist/
```
الخادم (Express) يقدّم مجلد `dist/` تلقائيًا، فيكفي في الإنتاج:
```bash
cd server && npm start        # يقدّم الـ API + الموقع من نفس المنفذ
```
على **Hostinger**: ارفع المشروع، شغّل `npm run build` ثم `node server/index.js`،
واضبط متغيرات البيئة وقاعدة MySQL من لوحة الاستضافة (راجع `server/.htaccess.example`).

---

## 🗄️ مصدر المحتوى
كل النصوص (14 خدمة، صفحة «من نحن»، بيانات التواصل، الترجمات الإنجليزية)
مُستخرجة فعليًا من النسخة الاحتياطية للموقع القديم (WordPress) وتُحفظ في
`server/db/seed/content.json`، ثم تُحمّل إلى القاعدة عبر `npm run seed`.

يمكن بعد ذلك تعديل كل شيء من لوحة التحكم دون لمس الكود.
