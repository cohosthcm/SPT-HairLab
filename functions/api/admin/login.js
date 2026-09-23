import { json, taoVe, bangNhau } from '../../../lib/server.js';

/* chậm lại một nhịp mỗi lần thử — dò mật khẩu sẽ rất lâu */
const cho = ms => new Promise(r => setTimeout(r, ms));

export async function onRequestPost({ request, env }) {
    if (!env.ADMIN_PASSWORD) return json({ ok: false, err: 'Chưa đặt ADMIN_PASSWORD trong Cloudflare' }, 503);
    let b = {};
    try { b = await request.json(); } catch (e) { }
    await cho(400);
    if (!bangNhau(String(b.password || ''), env.ADMIN_PASSWORD)) return json({ ok: false, err: 'Sai mật khẩu' }, 401);
    return json({ ok: true, token: await taoVe(env) });
}
