/* Ghi một lượt vào trang. Trang web gửi lên khi vừa mở.
   KHÔNG lưu địa chỉ IP, không dùng cookie theo dõi — chỉ lưu tỉnh/thành
   (Cloudflare tự suy ra) và loại máy, nên không cần xin phép khách. */
import { json, taoBang, ngayVN, gon, docMay, laBot, tenTinh, thieuDB } from '../../lib/server.js';

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
    await env.DB.prepare(`INSERT INTO visits (ts, day, sid, path, src, qr, ref, country, region, city, device, os, brand, browser, lang)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        ts, ngayVN(ts), gon(b.sid, 40), gon(b.path, 120), gon(b.src, 40) || 'truc-tiep', gon(b.qr, 40) || null,
        gon(b.ref, 80), gon(cf.country, 4), tenTinh(cf.region, cf.country), gon(cf.city, 60),
        may.device, may.os, may.brand, may.browser, gon(b.lang, 5)
    ).run();
    return json({ ok: true });
}
