/* ĐĂNG NHẬP TRANG QUẢN TRỊ
   Lớp 1: tên đăng nhập + mật khẩu, kiểm ở máy chủ (không nằm trong mã nguồn).
   Lớp 2: gõ sai 5 lần thì phải nhập thêm MÃ 6 SỐ gửi về email của chủ trang
          (thư gửi từ support@sptlab.co). Không có email là không vào được,
          dù có đoán trúng mật khẩu.
   Chặn phá: 1 phút mới cho gửi lại mã, tối đa 5 mã mỗi lượt, gõ sai mã 5 lần
          là khoá hẳn 30 phút. */
import { json, taoVe, bangNhau, taoBang, bam, guiThu, esc } from '../../../lib/server.js';

const LAN_TOI_DA = 5;        /* sai bấy nhiêu lần thì bắt đầu đòi mã email */
const MA_PHUT = 10;          /* mã sống 10 phút */
const MA_SAI_TOI_DA = 5;     /* gõ sai mã bấy nhiêu lần */
const KHOA_PHUT = 30;        /* thì khoá hẳn 30 phút */
const GUI_LAI_GIAY = 60;     /* 1 phút mới cho gửi lại mã */
const MA_TOI_DA = 5;         /* tối đa 5 mã cho một lượt bị khoá */
const KHOA_PHUT_KHONG_MAIL = 15;  /* không gửi được mail thì quay về khoá theo giờ */

const cho = ms => new Promise(r => setTimeout(r, ms));
const chePhu = e => {
    const [a, b] = String(e || '').split('@');
    if (!b) return 'email đã cài';
    return a.slice(0, 2) + '***@' + b;
};

export async function onRequestPost({ request, env }) {
    if (!env.ADMIN_PASSWORD) return json({ ok: false, err: 'Chưa đặt ADMIN_PASSWORD trong Cloudflare' }, 503);
    let b = {};
    try { b = await request.json(); } catch (e) { }

    const nguoi = String(b.user || '').trim();
    const matKhau = String(b.password || '');
    const maGo = String(b.ma || '').replace(/\D/g, '');
    const xinMaMoi = !!b.guiLaiMa;
    const tenDung = String(env.ADMIN_USER || 'admin').trim();

    /* Khoá theo máy đang gõ. KHÔNG lưu địa chỉ IP: chỉ lưu dấu vân tay đã băm
       của nó, lấy mật khẩu quản trị làm muối nên không lần ngược ra IP được. */
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'khong-ro';
    const khoaMay = (await bam(env.ADMIN_PASSWORD + '|' + ip)).slice(0, 32);
    const gio = Date.now();

    let db = env.DB || null;
    if (db) { try { await taoBang(db); } catch (e) { db = null; } }

    /* Chưa gắn cơ sở dữ liệu thì không đếm được số lần sai — vẫn kiểm mật khẩu
       bình thường, chỉ là không có lớp mã email. */
    if (!db) {
        await cho(400);
        const okThuong = bangNhau(nguoi || tenDung, tenDung) && bangNhau(matKhau, env.ADMIN_PASSWORD);
        return okThuong ? json({ ok: true, token: await taoVe(env), user: tenDung })
            : json({ ok: false, err: 'Sai tên đăng nhập hoặc mật khẩu' }, 401);
    }

    const doc = () => db.prepare('SELECT * FROM chan_dang_nhap WHERE k = ?').bind(khoaMay).first();
    const ghi = (o) => db.prepare(`INSERT INTO chan_dang_nhap
            (k, n, den, lan_cuoi, ma, ma_het, ma_sai, ma_gui, ma_so_lan) VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(k) DO UPDATE SET n=excluded.n, den=excluded.den, lan_cuoi=excluded.lan_cuoi,
            ma=excluded.ma, ma_het=excluded.ma_het, ma_sai=excluded.ma_sai,
            ma_gui=excluded.ma_gui, ma_so_lan=excluded.ma_so_lan`)
        .bind(khoaMay, o.n || 0, o.den || 0, gio, o.ma || null, o.ma_het || 0,
              o.ma_sai || 0, o.ma_gui || 0, o.ma_so_lan || 0).run();

    let r = (await doc()) || { n: 0, den: 0, ma: null, ma_het: 0, ma_sai: 0, ma_gui: 0, ma_so_lan: 0 };

    /* đang bị khoá hẳn */
    if (r.den > gio) {
        const con = Math.ceil((r.den - gio) / 60000);
        return json({ ok: false, khoa: true, phut: con, err: 'Đang khoá. Thử lại sau ' + con + ' phút.' }, 429);
    }

    const denMa = [String(env.ADMIN_EMAIL || '').trim()
        || String(env.LEAD_EMAIL || '').split(',')[0].trim()].filter(Boolean);
    const canMa = (r.n || 0) >= LAN_TOI_DA;

    /* mật khẩu phải đúng đã — sai thì không gửi mã, không lộ gì thêm */
    await cho(400);
    const dungMK = bangNhau(nguoi || tenDung, tenDung) && bangNhau(matKhau, env.ADMIN_PASSWORD);

    /* ---------- CHƯA tới mức đòi mã ---------- */
    if (!canMa) {
        if (dungMK) {
            await db.prepare('DELETE FROM chan_dang_nhap WHERE k = ?').bind(khoaMay).run();
            return json({ ok: true, token: await taoVe(env), user: tenDung });
        }
        const lan = (r.n || 0) + 1;
        await ghi({ ...r, n: lan });
        if (lan >= LAN_TOI_DA) {
            /* lần sai thứ 5: chuyển sang bắt nhập mã, gửi mã luôn */
            const kq = await guiMa(env, db, khoaMay, gio, { ...r, n: lan }, denMa);
            return json({ ok: false, canMa: kq.ok, guiToi: kq.ok ? chePhu(denMa[0]) : null,
                khoa: !kq.ok, phut: kq.ok ? 0 : KHOA_PHUT_KHONG_MAIL,
                err: kq.ok ? 'Sai 5 lần. Đã gửi mã xác nhận tới email của bạn.'
                    : 'Sai 5 lần. Không gửi được mã (' + kq.err + ') nên khoá tạm ' + KHOA_PHUT_KHONG_MAIL + ' phút.' }, 401);
        }
        return json({ ok: false, err: 'Sai tên đăng nhập hoặc mật khẩu', conLai: LAN_TOI_DA - lan }, 401);
    }

    /* ---------- ĐANG ở bước đòi mã ---------- */
    if (!dungMK) {
        /* mật khẩu vẫn sai thì cứ báo sai, không đụng tới mã */
        return json({ ok: false, canMa: true, guiToi: chePhu(denMa[0]),
            err: 'Sai tên đăng nhập hoặc mật khẩu' }, 401);
    }

    /* bấm "gửi lại mã", hoặc chưa có mã nào, hoặc mã cũ đã hết hạn */
    const maConSong = r.ma && r.ma_het > gio;
    if (xinMaMoi || !maConSong) {
        const conCho = Math.ceil(((r.ma_gui || 0) + GUI_LAI_GIAY * 1000 - gio) / 1000);
        if (maConSong && conCho > 0) {
            return json({ ok: false, canMa: true, guiToi: chePhu(denMa[0]),
                err: 'Chờ ' + conCho + ' giây nữa mới gửi lại được mã.' }, 429);
        }
        if ((r.ma_so_lan || 0) >= MA_TOI_DA) {
            await ghi({ ...r, den: gio + KHOA_PHUT * 60000, ma: null });
            return json({ ok: false, khoa: true, phut: KHOA_PHUT,
                err: 'Xin mã quá nhiều lần. Khoá ' + KHOA_PHUT + ' phút.' }, 429);
        }
        const kq = await guiMa(env, db, khoaMay, gio, r, denMa);
        return json({ ok: false, canMa: kq.ok, guiToi: kq.ok ? chePhu(denMa[0]) : null,
            khoa: !kq.ok, phut: kq.ok ? 0 : KHOA_PHUT_KHONG_MAIL,
            err: kq.ok ? 'Đã gửi mã mới tới email của bạn.' : 'Không gửi được mã: ' + kq.err }, kq.ok ? 401 : 429);
    }

    /* chưa gõ mã */
    if (!maGo) {
        return json({ ok: false, canMa: true, guiToi: chePhu(denMa[0]),
            err: 'Nhập mã 6 số vừa gửi về email.' }, 401);
    }

    /* kiểm mã */
    const maBam = (await bam(env.ADMIN_PASSWORD + '|ma|' + maGo)).slice(0, 40);
    if (!bangNhau(maBam, r.ma)) {
        const sai = (r.ma_sai || 0) + 1;
        if (sai >= MA_SAI_TOI_DA) {
            await ghi({ ...r, ma: null, ma_sai: 0, den: gio + KHOA_PHUT * 60000 });
            return json({ ok: false, khoa: true, phut: KHOA_PHUT,
                err: 'Sai mã quá nhiều. Khoá ' + KHOA_PHUT + ' phút.' }, 429);
        }
        await ghi({ ...r, ma_sai: sai });
        return json({ ok: false, canMa: true, guiToi: chePhu(denMa[0]),
            err: 'Mã không đúng', conLai: MA_SAI_TOI_DA - sai }, 401);
    }

    /* đúng hết — xoá sạch dấu vết chặn */
    await db.prepare('DELETE FROM chan_dang_nhap WHERE k = ?').bind(khoaMay).run();
    return json({ ok: true, token: await taoVe(env), user: tenDung });
}

/* Sinh mã 6 số, lưu bản đã băm, gửi thư từ support@sptlab.co */
async function guiMa(env, db, khoaMay, gio, r, den) {
    if (!den.length) return { ok: false, err: 'chưa cài email nhận mã' };
    const so = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    const maBam = (await bam(env.ADMIN_PASSWORD + '|ma|' + so)).slice(0, 40);
    const kq = await guiThu(env, {
        den,
        tu: env.SUPPORT_FROM || 'ROOT & RISE LAB <support@sptlab.co>',
        loai: 'ma-dang-nhap',
        subject: 'Mã đăng nhập trang quản trị: ' + so,
        text: 'Ma dang nhap trang quan tri ROOT & RISE LAB: ' + so
            + '\nMa song ' + 10 + ' phut. Neu khong phai ban dang dang nhap, hay doi ngay ADMIN_PASSWORD trong Cloudflare.',
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:460px;margin:auto;padding:24px;
                 border:1px solid #e2d7c8;border-radius:16px;color:#22201c">
            <p style="margin:0 0 4px;font-size:13px;letter-spacing:.2em;color:#6b6358">ROOT &amp; RISE LAB</p>
            <h2 style="margin:0 0 14px;font-size:19px">Mã đăng nhập trang quản trị</h2>
            <p style="margin:0 0 6px;font-size:14px;color:#6b6358">Có người gõ sai mật khẩu 5 lần rồi gõ đúng. Nhập mã này để vào:</p>
            <div style="font:700 34px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.18em;
                 background:#e5f1ee;color:#0f6b5c;padding:16px;border-radius:12px;text-align:center;margin:12px 0">${esc(so)}</div>
            <p style="margin:0 0 6px;font-size:13.5px;color:#6b6358">Mã sống 10 phút.</p>
            <p style="margin:0;font-size:13.5px;color:#b42323"><b>Không phải bạn?</b> Vào Cloudflare đổi ngay ADMIN_PASSWORD — có người đang dò mật khẩu.</p>
        </div>`
    });
    if (!kq.ok) {
        await db.prepare('UPDATE chan_dang_nhap SET den = ? WHERE k = ?')
            .bind(gio + KHOA_PHUT_KHONG_MAIL * 60000, khoaMay).run();
        return kq;
    }
    await db.prepare(`UPDATE chan_dang_nhap SET ma = ?, ma_het = ?, ma_sai = 0, ma_gui = ?, ma_so_lan = ? WHERE k = ?`)
        .bind(maBam, gio + MA_PHUT * 60000, gio, (r.ma_so_lan || 0) + 1, khoaMay).run();
    return { ok: true };
}
