-- PostgreSQL 18 Başlatma Scripti
-- Modüler Monolit 'admin' şemasının oluşturulması
CREATE SCHEMA IF NOT EXISTS admin;

-- admin şeması üzerinde arama yolu ve yetkilendirme
COMMENT ON SCHEMA admin IS 'Modüler Monolit - Yeniden kullanılabilir Admin Modülü Şeması';
