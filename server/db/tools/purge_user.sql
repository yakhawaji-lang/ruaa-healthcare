-- ============================================================================
--  حذف نهائي لحساب مستخدم من قاعدة بيانات رؤى (users) مع كل ما يتعلق به.
--  الجداول في هذا المشروع بلا مفاتيح أجنبية (FOREIGN KEY)، لذلك حذف صف
--  المستخدم وحده يترك صفوفاً يتيمة في الجداول التابعة — هذا السكربت ينظّفها.
--
--  الاستخدام: عدّل رقم الحساب في السطر التالي فقط، ثم شغّل الملف كاملاً.
--  تحذير: العملية نهائية ولا تُسترجع. خُذ نسخة احتياطية (تصدير) أولاً.
-- ============================================================================

SET @uid := 29;   -- <<< رقم الحساب المراد حذفه نهائياً

-- ---------------------------------------------------------------------------
--  الخطوة 1 — معاينة قبل الحذف (شغّل هذا الجزء وحده أولاً واقرأ النتيجة)
-- ---------------------------------------------------------------------------
SELECT 'users'             AS table_name, COUNT(*) AS rows_affected FROM users              WHERE id = @uid
UNION ALL SELECT 'users (تابعون له)',      COUNT(*) FROM users              WHERE parent_user_id = @uid
UNION ALL SELECT 'insurance_cases',        COUNT(*) FROM insurance_cases    WHERE user_id = @uid OR patient_user_id = @uid
UNION ALL SELECT 'service_requests',       COUNT(*) FROM service_requests   WHERE user_id = @uid
UNION ALL SELECT 'visits',                 COUNT(*) FROM visits             WHERE user_id = @uid
UNION ALL SELECT 'patient_profiles',       COUNT(*) FROM patient_profiles   WHERE user_id = @uid
UNION ALL SELECT 'insurer_services',       COUNT(*) FROM insurer_services   WHERE user_id = @uid
UNION ALL SELECT 'notifications',          COUNT(*) FROM notifications      WHERE recipient_type = 'user' AND recipient_id = @uid
UNION ALL SELECT 'push_subscriptions',     COUNT(*) FROM push_subscriptions WHERE recipient_type = 'user' AND recipient_id = @uid;

-- إن ظهر أي رقم في سطر "users (تابعون له)" فالحساب أبٌ لمستخدمين آخرين:
-- توقّف وقرّر مصيرهم أولاً (نقلهم لشركة أخرى أو حذفهم) قبل المتابعة.

-- ---------------------------------------------------------------------------
--  الخطوة 2 — التقاط أرقام الحالات والطلبات المرتبطة (لازمة لتنظيف التوابع)
-- ---------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _purge_cases;
DROP TEMPORARY TABLE IF EXISTS _purge_reqs;

CREATE TEMPORARY TABLE _purge_cases AS
  SELECT id FROM insurance_cases  WHERE user_id = @uid OR patient_user_id = @uid;
CREATE TEMPORARY TABLE _purge_reqs  AS
  SELECT id FROM service_requests WHERE user_id = @uid;

-- ---------------------------------------------------------------------------
--  الخطوة 3 — الحذف النهائي
-- ---------------------------------------------------------------------------

-- المراسلات والمرفقات وسجل الأحداث المرتبطة بالحالات
DELETE FROM messages_thread WHERE ref_type = 'insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);
DELETE FROM attachments     WHERE ref_type = 'insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);
DELETE FROM request_events  WHERE ref_type = 'insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);
DELETE FROM visits          WHERE ref_type = 'insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);

-- ونفس الشيء للطلبات
DELETE FROM messages_thread WHERE ref_type = 'service_request' AND ref_id IN (SELECT id FROM _purge_reqs);
DELETE FROM attachments     WHERE ref_type = 'service_request' AND ref_id IN (SELECT id FROM _purge_reqs);
DELETE FROM request_events  WHERE ref_type = 'service_request' AND ref_id IN (SELECT id FROM _purge_reqs);
DELETE FROM visits          WHERE ref_type = 'service_request' AND ref_id IN (SELECT id FROM _purge_reqs);

-- الحالات والطلبات نفسها
DELETE FROM insurance_cases  WHERE user_id = @uid OR patient_user_id = @uid;
DELETE FROM service_requests WHERE user_id = @uid;

-- ما يخصّ الحساب مباشرة
DELETE FROM visits             WHERE user_id = @uid;
DELETE FROM patient_profiles   WHERE user_id = @uid;
DELETE FROM insurer_services   WHERE user_id = @uid;
DELETE FROM notifications      WHERE recipient_type = 'user' AND recipient_id = @uid;
DELETE FROM push_subscriptions WHERE recipient_type = 'user' AND recipient_id = @uid;

-- وأخيراً صف المستخدم
DELETE FROM users WHERE id = @uid;

DROP TEMPORARY TABLE IF EXISTS _purge_cases;
DROP TEMPORARY TABLE IF EXISTS _purge_reqs;

-- ---------------------------------------------------------------------------
--  الخطوة 4 — التحقق (يجب أن تكون النتيجة صفراً)
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS remaining FROM users WHERE id = @uid;

-- سجل audit_log يُترك كما هو عمداً: هو سجل تدقيق تاريخي لعمليات الإدارة
-- ولا يُفترض تعديله. لحذفه أيضاً:
-- DELETE FROM audit_log WHERE entity IN ('insurer','client','insurer_member') AND entity_id = @uid;
