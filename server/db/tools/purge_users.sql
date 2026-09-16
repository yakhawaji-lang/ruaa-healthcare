-- ============================================================================
--  حذف نهائي لعدة حسابات من قاعدة بيانات رؤى (users) مع كل ما يتعلق بها.
--  الجداول بلا مفاتيح أجنبية، لذلك حذف صف المستخدم وحده يترك صفوفاً يتيمة —
--  هذا السكربت ينظّفها بالترتيب الصحيح.
--
--  الاستخدام: عدّل قائمة الإيميلات في الخطوة 1، شغّل الخطوة 2 (المعاينة)
--  واقرأ نتيجتها، ثم — إن كانت مقبولة — شغّل الخطوة 3 وما بعدها.
--  تحذير: نهائي ولا يُسترجع. صدّر نسخة احتياطية أولاً.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  الخطوة 1 — تحديد الحسابات المستهدفة
-- ---------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _purge_ids;
CREATE TEMPORARY TABLE _purge_ids (id INT PRIMARY KEY);

INSERT INTO _purge_ids (id)
SELECT id FROM users WHERE email IN (
  'mohammad.abusittah@medgulf.com.sa',
  'osama.kaware@medgulf.com.sa',
  'nabil.alhaddad@medgulf.com.sa',
  'amer.ahmed@medgulf.com.sa'
);

-- ---------------------------------------------------------------------------
--  الخطوة 2 — المعاينة: شغّل هذين الاستعلامين وحدهما أولاً
-- ---------------------------------------------------------------------------

-- 2أ) ما هي الحسابات فعلياً، وهل هي محذوفة ناعماً أم ما زالت فعّالة؟
SELECT u.id, u.role, u.name, u.company_name, u.email, u.parent_user_id,
       u.is_active, u.deleted_at,
       CASE WHEN u.deleted_at IS NULL THEN '⚠ حساب فعّال — سيُحذف نهائياً'
            ELSE 'محذوف ناعماً' END AS state
FROM users u JOIN _purge_ids p ON p.id = u.id
ORDER BY u.id;

-- 2ب) كم صفاً مرتبطاً سيُحذف معها؟
SELECT 'users (تابعون لها)' AS table_name, COUNT(*) AS rows_affected
       FROM users WHERE parent_user_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'insurance_cases',    COUNT(*) FROM insurance_cases
       WHERE user_id IN (SELECT id FROM _purge_ids) OR patient_user_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'service_requests',   COUNT(*) FROM service_requests   WHERE user_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'visits',             COUNT(*) FROM visits             WHERE user_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'patient_profiles',   COUNT(*) FROM patient_profiles   WHERE user_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'insurer_services',   COUNT(*) FROM insurer_services   WHERE user_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'notifications',      COUNT(*) FROM notifications      WHERE recipient_type='user' AND recipient_id IN (SELECT id FROM _purge_ids)
UNION ALL SELECT 'push_subscriptions', COUNT(*) FROM push_subscriptions WHERE recipient_type='user' AND recipient_id IN (SELECT id FROM _purge_ids);

-- توقّف هنا إن ظهر:
--   • حساب حالته "⚠ حساب فعّال" ولم تكن تقصد حذفه  → احذفه من القائمة أعلاه.
--   • رقم في سطر "users (تابعون لها)"               → قرّر مصير التابعين أولاً.

-- ---------------------------------------------------------------------------
--  الخطوة 3 — التقاط أرقام الحالات والطلبات المرتبطة
-- ---------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _purge_cases;
DROP TEMPORARY TABLE IF EXISTS _purge_reqs;

CREATE TEMPORARY TABLE _purge_cases AS
  SELECT id FROM insurance_cases
  WHERE user_id IN (SELECT id FROM _purge_ids) OR patient_user_id IN (SELECT id FROM _purge_ids);
CREATE TEMPORARY TABLE _purge_reqs AS
  SELECT id FROM service_requests WHERE user_id IN (SELECT id FROM _purge_ids);

-- ---------------------------------------------------------------------------
--  الخطوة 4 — الحذف النهائي
-- ---------------------------------------------------------------------------

-- المراسلات والمرفقات والأحداث والزيارات المعلّقة بالحالات
DELETE FROM messages_thread WHERE ref_type='insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);
DELETE FROM attachments     WHERE ref_type='insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);
DELETE FROM request_events  WHERE ref_type='insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);
DELETE FROM visits          WHERE ref_type='insurance_case'  AND ref_id IN (SELECT id FROM _purge_cases);

-- ونفس الشيء للطلبات
DELETE FROM messages_thread WHERE ref_type='service_request' AND ref_id IN (SELECT id FROM _purge_reqs);
DELETE FROM attachments     WHERE ref_type='service_request' AND ref_id IN (SELECT id FROM _purge_reqs);
DELETE FROM request_events  WHERE ref_type='service_request' AND ref_id IN (SELECT id FROM _purge_reqs);
DELETE FROM visits          WHERE ref_type='service_request' AND ref_id IN (SELECT id FROM _purge_reqs);

-- الحالات والطلبات نفسها
DELETE FROM insurance_cases
  WHERE user_id IN (SELECT id FROM _purge_ids) OR patient_user_id IN (SELECT id FROM _purge_ids);
DELETE FROM service_requests   WHERE user_id IN (SELECT id FROM _purge_ids);

-- ما يخصّ الحسابات مباشرة
DELETE FROM visits             WHERE user_id IN (SELECT id FROM _purge_ids);
DELETE FROM patient_profiles   WHERE user_id IN (SELECT id FROM _purge_ids);
DELETE FROM insurer_services   WHERE user_id IN (SELECT id FROM _purge_ids);
DELETE FROM notifications      WHERE recipient_type='user' AND recipient_id IN (SELECT id FROM _purge_ids);
DELETE FROM push_subscriptions WHERE recipient_type='user' AND recipient_id IN (SELECT id FROM _purge_ids);

-- وأخيراً صفوف المستخدمين
DELETE FROM users WHERE id IN (SELECT id FROM _purge_ids);

-- ---------------------------------------------------------------------------
--  الخطوة 5 — التحقق (يجب أن تكون النتيجة صفراً)
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS remaining FROM users WHERE email IN (
  'mohammad.abusittah@medgulf.com.sa',
  'osama.kaware@medgulf.com.sa',
  'nabil.alhaddad@medgulf.com.sa',
  'amer.ahmed@medgulf.com.sa'
);

DROP TEMPORARY TABLE IF EXISTS _purge_cases;
DROP TEMPORARY TABLE IF EXISTS _purge_reqs;
DROP TEMPORARY TABLE IF EXISTS _purge_ids;

-- سجل audit_log يُترك عمداً: هو سجل تدقيق تاريخي لعمليات الإدارة.
