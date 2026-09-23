/* ============================================================
   PHẦN CHẠY TRÊN MÁY CHỦ (Cloudflare Pages Functions)
   Dùng chung cho các đường /api/*. Không chứa mật khẩu hay khoá nào:
   mọi thứ bí mật nằm trong "Variables and Secrets" của Cloudflare.

   Các biến cần có trong Cloudflare (xem file cai-dat-cloudflare.html):
     DB              — cơ sở dữ liệu D1 (binding)
     ADMIN_USER      — tên đăng nhập trang quản trị (để trống thì là "admin")
     ADMIN_PASSWORD  — mật khẩu trang quản trị (secret)
     LEAD_EMAIL      — email nhận thông báo khách mới, nhiều email cách nhau dấu phẩy
     RESEND_API_KEY  — khoá gửi thư của Resend (secret)
     MAIL_FROM       — (tuỳ chọn) người gửi, mặc định "ROOT & RISE LAB <thongbao@sptlab.co>"
   ============================================================ */

export const json = (data, status = 200, extra = {}) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra }
    });

/* ---------- bảng dữ liệu: tự tạo ở lần chạy đầu, Phil không phải dán lệnh gì ---------- */
let daTaoBang = false;
export async function taoBang(db) {
    if (daTaoBang) return;
    await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, day TEXT NOT NULL,
            sid TEXT, path TEXT, src TEXT, qr TEXT, ref TEXT,
            country TEXT, region TEXT, city TEXT,
            device TEXT, os TEXT, brand TEXT, browser TEXT, lang TEXT)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS visits_day ON visits(day)`),
        db.prepare(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL,
            name TEXT, phone TEXT, need TEXT, product TEXT, src TEXT, qr TEXT,
            region TEXT, device TEXT, lang TEXT,
            consent_ts INTEGER, consent_text TEXT,
            status TEXT DEFAULT 'moi', emailed INTEGER DEFAULT 0, mail_err TEXT, note TEXT)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS leads_ts ON leads(ts)`),
        /* đếm số lần gõ sai mật khẩu quản trị, để khoá tạm.
           Chỉ lưu DẤU VÂN TAY đã băm của máy, không lưu địa chỉ IP. */
        db.prepare(`CREATE TABLE IF NOT EXISTS chan_dang_nhap (
            k TEXT PRIMARY KEY, n INTEGER DEFAULT 0, den INTEGER DEFAULT 0, lan_cuoi INTEGER)`)
    ]);
    daTaoBang = true;
}

/* ---------- ngày theo giờ Việt Nam (UTC+7) ---------- */
export const ngayVN = ts => new Date(ts + 7 * 3600e3).toISOString().slice(0, 10);

/* ---------- cắt gọn chuỗi đầu vào ---------- */
export const gon = (v, max = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

/* ---------- đọc loại máy từ User-Agent ----------
   Chrome trên Android giấu tên máy trong User-Agent, nên trang web gửi kèm
   "model" lấy từ trình duyệt (userAgentData) khi có. */
export function docMay(ua = '', model = '') {
    const u = String(ua);
    const tablet = /iPad|Tablet|Tab\b|(Android(?!.*Mobile))/i.test(u);
    const mobile = !tablet && /Mobi|iPhone|iPod|Android/i.test(u);
    const device = tablet ? 'tablet' : mobile ? 'mobile' : 'desktop';
    const os = /iPhone|iPad|iPod/i.test(u) ? 'iOS'
        : /Android/i.test(u) ? 'Android'
        : /Windows/i.test(u) ? 'Windows'
        : /Macintosh|Mac OS X/i.test(u) ? 'macOS'
        : /CrOS/i.test(u) ? 'ChromeOS'
        : /Linux/i.test(u) ? 'Linux' : 'Khác';
    const browser = /Zalo/i.test(u) ? 'Zalo'
        : /FBAN|FBAV|FB_IAB|FBIOS/i.test(u) ? 'Facebook'
        : /Instagram/i.test(u) ? 'Instagram'
        : /musical_ly|TikTok|BytedanceWebview/i.test(u) ? 'TikTok'
        : /coc_coc_browser/i.test(u) ? 'Cốc Cốc'
        : /Edg\//i.test(u) ? 'Edge'
        : /SamsungBrowser/i.test(u) ? 'Samsung Internet'
        : /CriOS|Chrome\//i.test(u) ? 'Chrome'
        : /FxiOS|Firefox\//i.test(u) ? 'Firefox'
        : /Safari\//i.test(u) ? 'Safari' : 'Khác';
    const m = (String(model) + ' ' + u);
    const brand = os === 'iOS' || os === 'macOS' ? 'Apple'
        : /SM-|Samsung|Galaxy/i.test(m) ? 'Samsung'
        : /\bCPH\d|OPPO/i.test(m) ? 'OPPO'
        : /Redmi|Xiaomi|\bMi \d|POCO|\b2\d{3}[A-Z0-9]{4,}\b|\bM2\d{3}/i.test(m) ? 'Xiaomi'
        : /\bvivo\b|\bV2\d{3}/i.test(m) ? 'vivo'
        : /\bRMX\d|realme/i.test(m) ? 'realme'
        : /Pixel/i.test(m) ? 'Google'
        : /HUAWEI|HONOR/i.test(m) ? 'Huawei/Honor'
        : /Nokia/i.test(m) ? 'Nokia'
        : os === 'Android' ? 'Android khác'
        : os === 'Windows' ? 'Máy tính Windows' : 'Khác';
    return { device, os, browser, brand };
}

export const laBot = ua => /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|uptime/i.test(ua || '');

/* ---------- tên tỉnh/thành: Cloudflare trả tiếng Anh, đổi sang tiếng Việt ---------- */
const TINH = {
    'Ho Chi Minh': 'TP. Hồ Chí Minh', 'Ho Chi Minh City': 'TP. Hồ Chí Minh', 'Hanoi': 'Hà Nội', 'Ha Noi': 'Hà Nội',
    'Da Nang': 'Đà Nẵng', 'Haiphong': 'Hải Phòng', 'Hai Phong': 'Hải Phòng', 'Can Tho': 'Cần Thơ',
    'Dong Nai': 'Đồng Nai', 'Binh Duong': 'Bình Dương', 'Khanh Hoa': 'Khánh Hoà', 'Lam Dong': 'Lâm Đồng',
    'Ba Ria-Vung Tau': 'Bà Rịa – Vũng Tàu', 'Thua Thien-Hue': 'Huế', 'Hue': 'Huế', 'Quang Ninh': 'Quảng Ninh',
    'Nghe An': 'Nghệ An', 'Thanh Hoa': 'Thanh Hoá', 'Bac Ninh': 'Bắc Ninh', 'Long An': 'Long An',
    'Tay Ninh': 'Tây Ninh', 'Gia Lai': 'Gia Lai', 'Dak Lak': 'Đắk Lắk', 'An Giang': 'An Giang',
    'Kien Giang': 'Kiên Giang', 'Tien Giang': 'Tiền Giang', 'Vinh Long': 'Vĩnh Long', 'Quang Nam': 'Quảng Nam',
    'Quang Ngai': 'Quảng Ngãi', 'Binh Dinh': 'Bình Định', 'Thai Nguyen': 'Thái Nguyên', 'Nam Dinh': 'Nam Định'
};
export const tenTinh = (region, country) => {
    if (!region) return country && country !== 'VN' ? 'Nước ngoài (' + country + ')' : 'Không rõ';
    if (country && country !== 'VN') return region + ' (' + country + ')';
    return TINH[region] || region.replace(/ Province$/i, '');
};

/* ---------- đăng nhập quản trị: vé ký bằng HMAC, hạn 7 ngày ---------- */
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function kyTen(key, msg) {
    const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
/* băm SHA-256 ra chuỗi chữ — dùng cho dấu vân tay máy khi đếm lần gõ sai */
export async function bam(chuoi) {
    const b = await crypto.subtle.digest('SHA-256', enc.encode(String(chuoi)));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* so sánh không để lộ thời gian (chống dò mật khẩu theo thời gian phản hồi) */
export function bangNhau(a, b) {
    a = String(a); b = String(b);
    let d = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return d === 0;
}
export async function taoVe(env) {
    const exp = Date.now() + 7 * 864e5;
    return exp + '.' + await kyTen(env.ADMIN_PASSWORD, 'admin.' + exp);
}
export async function kiemVe(request, env) {
    if (!env.ADMIN_PASSWORD) return false;
    const h = request.headers.get('authorization') || '';
    const ve = h.replace(/^Bearer\s+/i, '');
    const [exp, sig] = ve.split('.');
    if (!exp || !sig || +exp < Date.now()) return false;
    return bangNhau(sig, await kyTen(env.ADMIN_PASSWORD, 'admin.' + exp));
}

/* ---------- gửi thư qua Resend ---------- */
export async function guiThu(env, { subject, html, text }) {
    const den = String(env.LEAD_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!env.RESEND_API_KEY) return { ok: false, err: 'Chưa có RESEND_API_KEY' };
    if (!den.length) return { ok: false, err: 'Chưa có LEAD_EMAIL' };
    try {
        const r = await fetch(env.RESEND_URL || 'https://api.resend.com/emails', {
            method: 'POST',
            headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
            body: JSON.stringify({ from: env.MAIL_FROM || 'ROOT & RISE LAB <thongbao@sptlab.co>', to: den, subject, html, text })
        });
        if (!r.ok) return { ok: false, err: 'Resend ' + r.status + ': ' + gon(await r.text(), 200) };
        return { ok: true };
    } catch (e) {
        return { ok: false, err: gon(e && e.message, 200) };
    }
}

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* chưa gắn cơ sở dữ liệu → báo rõ thay vì văng lỗi khó hiểu */
export const thieuDB = () => json({ ok: false, err: 'Chưa gắn cơ sở dữ liệu (binding DB) trong Cloudflare' }, 503);
