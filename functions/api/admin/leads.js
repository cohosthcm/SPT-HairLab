/* Danh sách khách để lại thông tin: xem, đánh dấu đã gọi, ghi chú, xoá
   (xoá = quyền của khách theo Luật Bảo vệ dữ liệu cá nhân) */
import { json, taoBang, kiemVe, gon, thieuDB } from '../../../lib/server.js';

const TRANG_THAI = ['moi', 'da-goi', 'da-mua', 'khong-nghe'];

export async function onRequest({ request, env }) {
    if (!await kiemVe(request, env)) return json({ ok: false, err: 'Chưa đăng nhập' }, 401);
    if (!env.DB) return thieuDB();
    await taoBang(env.DB);
    const db = env.DB;
    if (request.method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM leads ORDER BY ts DESC LIMIT 2000').all();
        return json({ ok: true, leads: results });
    }
    let b = {};
    try { b = await request.json(); } catch (e) { return json({ ok: false }, 400); }
    const id = +b.id;
    if (!id) return json({ ok: false, err: 'Thiếu id' }, 400);
    if (request.method === 'DELETE') {
        await db.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
        return json({ ok: true });
    }
    if (request.method === 'POST') {
        if (b.status != null && !TRANG_THAI.includes(b.status)) return json({ ok: false, err: 'Trạng thái lạ' }, 400);
        await db.prepare('UPDATE leads SET status = COALESCE(?, status), note = COALESCE(?, note) WHERE id = ?')
            .bind(b.status ?? null, b.note != null ? gon(b.note, 500) : null, id).run();
        return json({ ok: true });
    }
    return json({ ok: false }, 405);
}
