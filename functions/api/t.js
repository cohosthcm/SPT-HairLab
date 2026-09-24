/* Ghi một lượt vào trang. Trang web gửi lên khi vừa mở.
   KHÔNG lưu địa chỉ IP, không dùng cookie theo dõi — chỉ lưu tỉnh/thành
   (Cloudflare tự suy ra) và loại máy, nên không cần xin phép khách.

   Chặn đếm trùng: cùng 1 IP mở/quét lại nhiều lần trong 30 phút chỉ tính 1 lượt —
   băm IP một chiều rồi so trong bảng chan_trung, KHÔNG lưu IP thật (xem lib/server.js). */
import { json, taoBang, ngayVN, gon, docMay, laBot, tenTinh, thieuDB, bam } from '../../lib/server.js';

const CUA_SO_TRUNG = 30 * 60 * 1000; // 30 phút

export async function onRequestPost({ request, env }) {
    if (!env.DB) return thieuDB();
    const ua = request.headers.get('user-agent') || '';
    if (laBot(ua)) return json({ ok: true, bo: 'bot' });
    let b = {};
    try { b = await request.json(); } catch (e) { return json({ ok: false }, 400); }
    const cf = request.cf || {};
    const may = docMay(ua, b.model);
    const ts = Date.now();
    await taoBang(env.DB);

    const ip = request.headers.get('cf-connecting-ip') || '';
    if (ip) {
        const k = await bam(ip);
        const cu = await env.DB.prepare(`SELECT lan_cuoi FROM chan_trung WHERE k = ?`).bind(k).first();
        if (cu && ts - cu.lan_cuoi < CUA_SO_TRUNG) {
            /* vẫn trong 30 phút kể từ lượt gần nhất của IP này — không đếm thêm,
               nhưng cập nhật lại "lần cuối" để còn đang hoạt động thì vẫn coi là 1 lượt. */
            await env.DB.prepare(`UPDATE chan_trung SET lan_cuoi = ? WHERE k = ?`).bind(ts, k).run();
            return json({ ok: true, trung: true });
        }
        await env.DB.prepare(`INSERT INTO chan_trung (k, lan_cuoi) VALUES (?, ?)
            ON CONFLICT(k) DO UPDATE SET lan_cuoi = excluded.lan_cuoi`).bind(k, ts).run();
        /* dọn bớt dấu vân tay đã quá cũ (hơn 1 ngày), không để bảng phình mãi —
           chỉ cần chạy thỉnh thoảng, không phải mỗi lượt. */
        if (Math.random() < 0.02) {
            await env.DB.prepare(`DELETE FROM chan_trung WHERE lan_cuoi < ?`).bind(ts - 24 * 3600e3).run();
        }
    }

    await env.DB.prepare(`INSERT INTO visits (ts, day, sid, path, src, qr, ref, country, region, city, device, os, brand, browser, lang)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        ts, ngayVN(ts), gon(b.sid, 40), gon(b.path, 120), gon(b.src, 40) || 'truc-tiep', gon(b.qr, 40) || null,
        gon(b.ref, 80), gon(cf.country, 4), tenTinh(cf.region, cf.country), gon(cf.city, 60),
        may.device, may.os, may.brand, may.browser, gon(b.lang, 5)
    ).run();
    return json({ ok: true });
}
