/* ĐẨY NỘI DUNG LÊN GITHUB — chạy Ở MÁY CHỦ, không phải trong trình duyệt.
   Dùng lại đúng phiên đăng nhập của trang quản trị (functions/api/admin/login.js):
   ai đăng nhập được vào trang quản trị (đúng ADMIN_PASSWORD) thì gọi được API
   này, không cần tự tạo/dán token GitHub riêng trong trình duyệt của họ nữa.

   Cần đặt MỘT LẦN biến môi trường GITHUB_TOKEN trong Cloudflare Pages
   (Settings → Environment variables), một Personal Access Token loại
   Fine-grained, chỉ cấp cho đúng kho SPT-HairLab, quyền Contents: Read and
   write. Token đó không nằm trong mã nguồn và không ai xem lại được. */
import { json, kiemVe } from '../../../lib/server.js';

const OWNER = 'cohosthcm', REPO = 'SPT-HairLab', BRANCH = 'main';
/* chỉ cho phép đẩy các file nội dung mà trang quản trị thật sự tạo ra —
   tránh việc lỡ ghi đè file mã nguồn nào khác trong kho */
const FILE_CHO_PHEP = new Set(['content.js']);

async function ghApi(path, token, opt = {}) {
    const r = await fetch('https://api.github.com' + path, {
        method: opt.method || 'GET',
        body: opt.body,
        headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'rootlab-admin',
            ...(opt.body ? { 'Content-Type': 'application/json' } : {})
        }
    });
    const raw = await r.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { }
    if (!r.ok) throw new Error(r.status + ' — ' + ((data && data.message) || raw.slice(0, 140)));
    return data;
}

/* base64 an toàn cho cả chữ tiếng Việt (UTF-8) */
function textToB64(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = ''; const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin);
}

export async function onRequestPost({ request, env }) {
    if (!await kiemVe(request, env)) return json({ ok: false, err: 'Chưa đăng nhập' }, 401);
    if (!env.GITHUB_TOKEN) {
        return json({ ok: false, err: 'Chưa đặt GITHUB_TOKEN trong Cloudflare (Settings → Environment variables của dự án Pages).' }, 503);
    }

    let b = {};
    try { b = await request.json(); } catch (e) { }
    const name = String(b.name || 'content.js').replace(/^\/+/, '');
    if (!FILE_CHO_PHEP.has(name)) return json({ ok: false, err: 'Không cho phép đẩy file "' + name + '" từ đây' }, 400);
    const content = String(b.content == null ? '' : b.content);
    if (!content.trim()) return json({ ok: false, err: 'Nội dung trống, không đẩy' }, 400);

    const token = env.GITHUB_TOKEN;
    const base = `/repos/${OWNER}/${REPO}/contents/${name}`;
    let sha = null;
    try {
        const cur = await ghApi(`${base}?ref=${BRANCH}`, token);
        sha = cur && cur.sha;
    } catch (e) {
        if (!/^404/.test(e.message)) return json({ ok: false, err: e.message }, 502);
    }

    const body = {
        message: 'Cập nhật ' + name + ' từ trang quản trị',
        content: textToB64(content),
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    try {
        await ghApi(base, token, { method: 'PUT', body: JSON.stringify(body) });
    } catch (e) {
        return json({ ok: false, err: e.message }, 502);
    }
    return json({ ok: true, ghiDe: !!sha });
}
