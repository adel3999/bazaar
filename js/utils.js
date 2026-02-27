// ===== Safe Storage للجلسة المحلية فقط =====
window.BazaarApp = window.BazaarApp || {};

const _memStore = {};
let _lsAvailable = (() => {
    try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); return true; }
    catch(e) { return false; }
})();

const _storage = {
    getItem: (k) => {
        if (_lsAvailable) {
            try { const v = localStorage.getItem(k); return v !== null ? v : (_memStore[k] || null); }
            catch(e) { _lsAvailable = false; return _memStore[k] || null; }
        }
        return _memStore[k] || null;
    },
    setItem: (k, v) => {
        _memStore[k] = v;
        if (_lsAvailable) {
            try { localStorage.setItem(k, v); }
            catch(e) { _lsAvailable = false; }
        }
    },
    removeItem: (k) => {
        delete _memStore[k];
        if (_lsAvailable) { try { localStorage.removeItem(k); } catch(e) { _lsAvailable = false; } }
    },
    clear: () => {
        Object.keys(_memStore).forEach(k => delete _memStore[k]);
        if (_lsAvailable) { try { localStorage.clear(); } catch(e) { _lsAvailable = false; } }
    }
};

window.safeStorage = function(action, key, value) {
    if (action === 'get') return _storage.getItem(key);
    if (action === 'set') return _storage.setItem(key, value);
    if (action === 'remove') return _storage.removeItem(key);
    if (action === 'clear') return _storage.clear();
};
window.safeGetJSON = function(key, fallback) {
    if (fallback === undefined) fallback = null;
    try { const v = _storage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; }
};
window.safeSetJSON = function(key, value) {
    try { _storage.setItem(key, JSON.stringify(value)); } catch(e) {}
};

// ==========================================
// ===== إعداد Supabase =====
// ← ضع بيانات مشروعك هنا بعد إنشائه على supabase.com
window.SUPABASE_URL = 'https://ctikigvuubfdnbemesrv.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0aWtpZ3Z1dWJmZG5iZW1lc3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQyMDQsImV4cCI6MjA4Nzc5MDIwNH0.vZZR4lKBYE_goNcyErmDt-eAPJHYlnDwdmsk-qww0sg';
// ==========================================

window._sb = null;
try {
    const { createClient } = supabase;
    window._sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    console.log('✅ Supabase متصل');
} catch(e) {
    console.error('❌ فشل تهيئة Supabase:', e);
}

// ===== جلب قيمة واحدة =====
window.dbGet = async function(key, fallback) {
    if (fallback === undefined) fallback = null;
    try {
        if (!window._sb) return fallback;
        const { data, error } = await window._sb
            .from('app_data').select('value').eq('key', key).maybeSingle();
        if (error) { console.error('dbGet error:', key, error.message); return fallback; }
        return (data && data.value !== undefined) ? data.value : fallback;
    } catch(e) { console.error('dbGet exception:', key, e); return fallback; }
};

// ===== حفظ قيمة واحدة =====
window.dbSet = async function(key, value) {
    try {
        if (!window._sb) return;
        const { error } = await window._sb.from('app_data').upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
        );
        if (error) console.error('dbSet error:', key, error.message);
    } catch(e) { console.error('dbSet exception:', key, e); }
};

// ===== حذف مفتاح من Supabase =====
window.dbDelete = async function(key) {
    try {
        if (!window._sb) return;
        const { error } = await window._sb.from('app_data').delete().eq('key', key);
        if (error) console.error('dbDelete error:', key, error.message);
    } catch(e) { console.error('dbDelete exception:', key, e); }
};

// ===== مسح كامل قاعدة البيانات =====
window.dbClearAll = async function() {
    try {
        if (!window._sb) return;
        const { error } = await window._sb.from('app_data').delete().neq('key', '__never__');
        if (error) console.error('dbClearAll error:', error.message);
    } catch(e) { console.error('dbClearAll exception:', e); }
};

// ===== تحميل جميع البيانات دفعة واحدة =====
window.dbLoadAll = async function() {
    try {
        if (!window._sb) return {};
        const { data, error } = await window._sb.from('app_data').select('key, value');
        if (error) { console.error('dbLoadAll error:', error.message); return {}; }
        const result = {};
        (data || []).forEach(row => { result[row.key] = row.value; });
        return result;
    } catch(e) { console.error('dbLoadAll exception:', e); return {}; }
};
