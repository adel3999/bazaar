-- ===== إعداد قاعدة بيانات Bazaar =====
-- نفّذ هذا الملف في Supabase SQL Editor

-- حذف الجدول إذا كان موجوداً (للبدء من جديد)
DROP TABLE IF EXISTS app_data;

-- إنشاء الجدول الرئيسي
CREATE TABLE app_data (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- سياسة مفتوحة (يمكن تقييدها لاحقاً)
CREATE POLICY "allow_all" ON app_data FOR ALL USING (true) WITH CHECK (true);

-- Index لتسريع البحث
CREATE INDEX idx_app_data_key ON app_data(key);
CREATE INDEX idx_app_data_updated ON app_data(updated_at);

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_data_updated
BEFORE UPDATE ON app_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== البيانات الافتراضية =====
INSERT INTO app_data (key, value) VALUES
    ('admins', '[{"id":"admin_default","username":"admin","password":"admin123","name":"المدير الرئيسي","role":"super_admin","createdAt":"2024-01-01T00:00:00.000Z"}]'),
    ('suppliers', '[]'),
    ('buyers', '[]'),
    ('products', '[]'),
    ('orders', '[]'),
    ('archivedOrders', '[]'),
    ('categories', '["الكل","حبوب","بقالة","زيوت","معكرونة","ألبان","مشروبات","توابل","معلبات","منظفات"]'),
    ('deliveryDrivers', '[]'),
    ('commissionPayments', '[]'),
    ('carts', '{}'),
    ('hiddenOrders', '{}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- التحقق من النتيجة
SELECT key, updated_at FROM app_data ORDER BY key;
