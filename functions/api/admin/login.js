/* Đăng nhập trang quản trị: tên đăng nhập + mật khẩu, kiểm ở MÁY CHỦ.
   Sai nhiều lần thì khoá tạm — chặn kiểu dò mật khẩu bằng máy.
   Tên và mật khẩu nằm trong Variables & Secrets của Cloudflare, không nằm
   trong mã nguồn, nên xem mã trang cũng không thấy gì. */
import { json, taoVe, bangNhau, taoBang, bam } from '../../../lib/server.js';

const LAN_TOI_DA = 5;          /* sai quá 5 lần */
const KHOA_PHUT = 15;          /* thì nghỉ 15 phút */
const cho = ms => new Promise(r => setTimeout(r, ms));

export async function onRequestPost({ request, env }) {
    if (!env.ADMIN_PASSWORD) return json({ ok: false, err: 'Chưa đặt ADMIN_PASSWORD trong Cloudflare' }, 503);
    let b = {};
    try { b = await request.json(); } catch (e) { }

    const nguoi = String(b.user || '').trim();
    const matKhau = String(b.password || '');
    const tenDung = String(env.ADMIN_USER || 'admin').trim();

    /* Khoá theo máy đang gõ. KHÔNG lưu địa chỉ IP: chỉ lưu dấu vân tay đã băm
       của nó, lấy mật khẩu quản trị làm muối nên không lần ngược ra IP được. */
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'khong-ro';
    const khoaMay = (await bam(env.ADMIN_PASSWORD + '|' + ip)).slice(0, 32);
    const gio = Date.now();
    let db = env.DB || null;
    if (db) { try { await taoBang(db); } catch (e) { db = null; } }

    if (db) {
        const cu = await db.prepare('SELECT n, den FROM chan_dang_nhap WHERE k = ?').bind(khoaMay).first();
        if (cu && cu.den > gio) {
            const con = Math.ceil((cu.den - gio) / 60000);
            return json({ ok: false, khoa: true, phut: con,
                err: 'Sai quá ' + LAN_TOI_DA + ' lần. Thử lại sau ' + con + ' phút.' }, 429);
        }
    }

    await cho(400);   /* chậm một nhịp — dò mật khẩu bằng máy sẽ rất lâu */

    const dung = bangNhau(nguoi || tenDung, tenDung) && bangNhau(matKhau, env.ADMIN_PASSWORD);
    if (!dung) {
        let lan = 1;
        if (db) {
            const cu = await db.prepare('SELECT n FROM chan_dang_nhap WHERE k = ?').bind(khoaMay).first();
            lan = ((cu && cu.n) || 0) + 1;
            const den = lan >= LAN_TOI_DA ? gio + KHOA_PHUT * 60000 : 0;
            await db.prepare(`INSERT INTO chan_dang_nhap (k, n, den, lan_cuoi) VALUES (?,?,?,?)
                ON CONFLICT(k) DO UPDATE SET n = excluded.n, den = excluded.den, lan_cuoi = excluded.lan_cuoi`)
                .bind(khoaMay, lan >= LAN_TOI_DA ? 0 : lan, den, gio).run();
            if (den) return json({ ok: false, khoa: true, phut: KHOA_PHUT,
                err: 'Sai quá ' + LAN_TOI_DA + ' lần. Khoá ' + KHOA_PHUT + ' phút.' }, 429);
        }
        return json({ ok: false, err: 'Sai tên đăng nhập hoặc mật khẩu', conLai: Math.max(0, LAN_TOI_DA - lan) }, 401);
    }

    if (db) { try { await db.prepare('DELETE FROM chan_dang_nhap WHERE k = ?').bind(khoaMay).run(); } catch (e) { } }
    return json({ ok: true, token: await taoVe(env), user: tenDung });
}
