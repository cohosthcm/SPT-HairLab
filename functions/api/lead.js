/* Khách để lại thông tin trong popup → lưu lại + gửi thư báo cho Phil.
   Theo Luật Bảo vệ dữ liệu cá nhân 2025: bắt buộc khách tự tick đồng ý,
   và lưu lại thời điểm + nội dung câu đồng ý để chứng minh khi cần. */
import { json, taoBang, gon, docMay, tenTinh, guiThu, esc, thieuDB } from '../../lib/server.js';

const NHU_CAU = { 'uu-dai': 'Nhận ưu đãi', 'tu-van': 'Cần tư vấn' };

export async function onRequestPost({ request, env, waitUntil }) {
    if (!env.DB) return thieuDB();
    let b = {};
    try { b = await request.json(); } catch (e) { return json({ ok: false, err: 'Dữ liệu không hợp lệ' }, 400); }

    /* ô bẫy: người thật không thấy ô này, máy spam thì hay điền vào */
    if (b.web) return json({ ok: true });

    const name = gon(b.name, 80);
    let phone = String(b.phone || '').replace(/[^\d+]/g, '');
    if (phone.startsWith('+84')) phone = '0' + phone.slice(3);
    else if (phone.startsWith('84') && phone.length === 11) phone = '0' + phone.slice(2);
    const need = NHU_CAU[b.need] ? b.need : 'tu-van';

    if (name.length < 2) return json({ ok: false, err: 'ten' }, 422);
    if (!/^0\d{9,10}$/.test(phone)) return json({ ok: false, err: 'sdt' }, 422);
    if (b.consent !== true) return json({ ok: false, err: 'dongy' }, 422);

    await taoBang(env.DB);
    const ts = Date.now();

    /* cùng số điện thoại gửi lại trong 10 phút → coi như một, không báo trùng */
    const cu = await env.DB.prepare('SELECT id FROM leads WHERE phone = ? AND ts > ?').bind(phone, ts - 10 * 60e3).first();
    if (cu) return json({ ok: true, trung: true });

    const cf = request.cf || {};
    const may = docMay(request.headers.get('user-agent') || '', b.model);
    const region = tenTinh(cf.region, cf.country);
    const product = gon(b.product, 60), qr = gon(b.qr, 40) || null, src = gon(b.src, 40);
    const r = await env.DB.prepare(`INSERT INTO leads (ts, name, phone, need, product, src, qr, region, device, lang, consent_ts, consent_text)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        ts, name, phone, need, product, src, qr, region, may.device + ' · ' + may.brand, gon(b.lang, 5),
        ts, gon(b.consentText, 400)
    ).run();
    const id = r.meta && r.meta.last_row_id;

    /* gửi thư chạy sau khi đã trả lời khách — khách không phải chờ */
    const gio = new Date(ts + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 16);
    const dong = (k, v) => `<tr><td style="padding:6px 14px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`;
    const viec = guiThu(env, {
        loai: 'khach-moi',
        subject: `Khách mới: ${name} · ${NHU_CAU[need]}${product ? ' · ' + product : ''}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
            <h2 style="margin:0 0 12px">Có khách vừa để lại thông tin</h2>
            <table>${dong('Họ tên', name)}${dong('Điện thoại', phone)}${dong('Nhu cầu', NHU_CAU[need])}
            ${dong('Sản phẩm', product || '—')}${dong('Đến từ', qr ? 'Quét mã QR ' + qr : (src || 'vào thẳng'))}
            ${dong('Khu vực', region)}${dong('Máy', may.device + ' · ' + may.brand)}${dong('Lúc', gio + ' (giờ VN)')}</table>
            <p style="margin-top:18px"><a href="tel:${esc(phone)}" style="background:#0f6b5c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Gọi ${esc(phone)}</a></p>
            <p style="color:#888;font-size:13px">Xem tất cả trong trang quản trị → Khách hàng.</p></div>`,
        text: `Khách mới: ${name} - ${phone} - ${NHU_CAU[need]} - ${product || ''} - ${region} - ${gio}`
    }).then(kq => env.DB.prepare('UPDATE leads SET emailed = ?, mail_err = ? WHERE id = ?')
        .bind(kq.ok ? 1 : 0, kq.ok ? null : kq.err, id).run());
    if (waitUntil) waitUntil(viec); else await viec;

    return json({ ok: true });
}
