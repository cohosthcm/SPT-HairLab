/* Số liệu cho trang quản trị: Tổng quan + Thống kê */
import { json, taoBang, ngayVN, kiemVe, thieuDB } from '../../../lib/server.js';

export async function onRequestGet({ request, env }) {
    if (!await kiemVe(request, env)) return json({ ok: false, err: 'Chưa đăng nhập' }, 401);
    if (!env.DB) return thieuDB();
    await taoBang(env.DB);
    const u = new URL(request.url);
    const days = Math.max(1, Math.min(366, +u.searchParams.get('days') || 30));
    const now = Date.now();
    const tu = ngayVN(now - (days - 1) * 864e5), homNay = ngayVN(now);
    const tuTs = Date.parse(tu + 'T00:00:00+07:00');
    const db = env.DB;
    const q = (sql, ...a) => db.prepare(sql).bind(...a);

    const nhom = cot => q(`SELECT COALESCE(NULLIF(${cot},''),'Không rõ') k, COUNT(*) n, COUNT(DISTINCT sid) s
        FROM visits WHERE day >= ? GROUP BY k ORDER BY n DESC LIMIT 20`, tu);

    /* ngày/tháng theo giờ UTC — đúng cách Resend tính hạn mức gói miễn phí */
    const isoNow = new Date().toISOString(), ngayUTC = isoNow.slice(0, 10), thangUTC = isoNow.slice(0, 7);

    const [tong, homnay, theoNgay, leadNgay, tongLead, leadMoi, nguon, tinh, may, hdh, hang, trinh, qr, tieng, thuNgay, thuThang] = await db.batch([
        q(`SELECT COUNT(*) views, COUNT(DISTINCT sid) sessions, SUM(qr IS NOT NULL) qr FROM visits WHERE day >= ?`, tu),
        q(`SELECT COUNT(*) views, COUNT(DISTINCT sid) sessions, SUM(qr IS NOT NULL) qr FROM visits WHERE day = ?`, homNay),
        q(`SELECT day, COUNT(*) views, COUNT(DISTINCT sid) sessions, SUM(qr IS NOT NULL) qr FROM visits WHERE day >= ? GROUP BY day ORDER BY day`, tu),
        q(`SELECT date(ts/1000 + 25200, 'unixepoch') day, COUNT(*) n FROM leads WHERE ts >= ? GROUP BY day`, tuTs),
        q(`SELECT COUNT(*) n FROM leads WHERE ts >= ?`, tuTs),
        q(`SELECT COUNT(*) n FROM leads WHERE status = 'moi'`),
        nhom('src'), nhom('region'), nhom('device'), nhom('os'), nhom('brand'), nhom('browser'), nhom('qr'), nhom('lang'),
        q(`SELECT COALESCE(SUM(so_nguoi),0) n FROM thu_da_gui WHERE ngay = ?`, ngayUTC),
        q(`SELECT COALESCE(SUM(so_nguoi),0) n FROM thu_da_gui WHERE thang = ?`, thangUTC)
    ]);
    const r = x => x.results || [];
    const lead1 = Object.fromEntries(r(leadNgay).map(x => [x.day, x.n]));
    /* đủ mọi ngày, ngày không ai vào vẫn có (bằng 0) để biểu đồ không bị hụt */
    const map = Object.fromEntries(r(theoNgay).map(x => [x.day, x]));
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = ngayVN(now - i * 864e5), x = map[d] || {};
        series.push({ day: d, views: x.views || 0, sessions: x.sessions || 0, qr: x.qr || 0, leads: lead1[d] || 0 });
    }
    return json({
        ok: true, days,
        tong: { ...r(tong)[0], leads: r(tongLead)[0].n, leadsMoi: r(leadMoi)[0].n },
        homNay: r(homnay)[0],
        series,
        nguon: r(nguon), tinh: r(tinh), may: r(may), hdh: r(hdh), hang: r(hang), trinh: r(trinh),
        qr: r(qr).filter(x => x.k !== 'Không rõ'), tieng: r(tieng),
        /* dùng cho khối "Sức chứa còn lại" ở Tổng quan — hạn mức gói Free của Resend
           (nguồn: resend.com/docs/knowledge-base/account-quotas-and-limits, tra 09/2026) */
        sucChua: {
            thuHomNay: r(thuNgay)[0].n, thuHomNayGioiHan: 100,
            thuThangNay: r(thuThang)[0].n, thuThangNayGioiHan: 3000
        }
    });
}
