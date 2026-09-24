/* ================================================================
   ROOT & RISE LAB — POPUP SẢN PHẨM KHI QUÉT MÃ QR + ĐẾM LƯỢT VÀO
   Nạp sau script chính của index.html nên dùng được C, LINES, LANG,
   spOf, dongOf, chaiCuaDong, rootlabGoto của trang.

   Mã QR in trên hộp:  https://sptlab.co/?qr=<mã>
     mã của từng chai  = products[n].qr   (thanh-loc, nuoi-duong, …)
     mã của hộp quà    = lines[n].qr      (bo-doi)
   Sửa nội dung popup trong trang quản trị → CHAI SẢN PHẨM.
   ================================================================ */
(function () {
    'use strict';
    const $ = (s, r = document) => r.querySelector(s);
    const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const L = (typeof LANG !== 'undefined' && LANG) || 'vi';
    const Cx = typeof C !== 'undefined' ? C : (window.ROOTLAB_CONTENT || {});
    const tham = new URLSearchParams(location.search);
    const QR = (tham.get('qr') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);

    /* ---------- chữ trên popup, đủ 5 ngôn ngữ ---------- */
    const T = {
        vi: { chinhHang: 'Chính hãng ROOT & RISE LAB', congDung: 'Công dụng', cachDung: 'Cách dùng', thanhPhan: 'Thành phần đầy đủ',
            luuY: 'Lưu ý', giayPhep: 'Chứng nhận & giấy phép', tem: 'Tem chống hàng giả & kiểm định', soCongBo: 'Số công bố mỹ phẩm',
            sanXuat: 'Nơi sản xuất', phanPhoi: 'Chịu trách nhiệm đưa ra thị trường', mst: 'Mã số doanh nghiệp', bct: 'Đã thông báo Bộ Công Thương',
            dong: 'Đóng', xemTrang: 'Xem trang sản phẩm', buoc: 'Bước', hopQua: 'Hộp quà 2 bước chuyên sâu', tang: 'Tặng kèm lược massage da đầu',
            formTieuDe: 'Nhận ưu đãi & tư vấn miễn phí', formPhu: 'Để lại số điện thoại, chúng tôi gọi lại trong giờ làm việc.',
            ten: 'Họ tên', sdt: 'Số điện thoại', uuDai: 'Nhận ưu đãi', tuVan: 'Cần tư vấn', gui: 'Gửi thông tin', dangGui: 'Đang gửi…',
            dongY: 'Tôi đồng ý để CÔNG TY TNHH SPT LAB lưu họ tên, số điện thoại của tôi để liên hệ tư vấn và gửi ưu đãi.',
            camOn: 'Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm.', loi: 'Chưa gửi được. Bạn nhắn Zalo hoặc gọi giúp mình nhé:', thuLai: 'Chưa gửi được, bạn thử lại sau ít phút nhé.',
            loiTen: 'Bạn nhập họ tên giúp mình', loiSdt: 'Số điện thoại chưa đúng', loiDongY: 'Bạn cần tick đồng ý để gửi',
            xemDayDu: 'Bấm vào để xem đầy đủ thông tin sản phẩm và chứng nhận', xemThem: 'Xem thêm' },
        en: { chinhHang: 'Genuine ROOT & RISE LAB', congDung: 'Benefits', cachDung: 'How to use', thanhPhan: 'Full ingredient list',
            luuY: 'Precautions', giayPhep: 'Certificates & licences', tem: 'Anti-counterfeit & quality seals', soCongBo: 'Cosmetic notification no.',
            sanXuat: 'Manufactured at', phanPhoi: 'Responsible for placing on the market', mst: 'Business registration no.', bct: 'Registered with the Ministry of Industry and Trade',
            dong: 'Close', xemTrang: 'View product page', buoc: 'Step', hopQua: '2-step gift box', tang: 'Free scalp massage comb included',
            formTieuDe: 'Get offers & free advice', formPhu: 'Leave your number and we will call you back during business hours.',
            ten: 'Full name', sdt: 'Phone number', uuDai: 'Get offers', tuVan: 'Need advice', gui: 'Send', dangGui: 'Sending…',
            dongY: 'I agree that SPT LAB COMPANY LIMITED may store my name and phone number to contact me with advice and offers.',
            camOn: 'Thank you! We will contact you soon.', loi: 'Could not send. Please message or call us:', thuLai: 'Could not send, please try again in a few minutes.',
            loiTen: 'Please enter your name', loiSdt: 'Phone number looks wrong', loiDongY: 'Please tick to agree',
            xemDayDu: 'Tap to see full product info & certificates', xemThem: 'See more' },
        fr: { chinhHang: 'Authentique ROOT & RISE LAB', congDung: 'Bienfaits', cachDung: 'Utilisation', thanhPhan: 'Liste complète des ingrédients',
            luuY: 'Précautions', giayPhep: 'Certificats & autorisations', tem: 'Sceaux anti-contrefaçon & contrôle', soCongBo: 'N° de notification cosmétique',
            sanXuat: 'Fabriqué par', phanPhoi: 'Responsable de la mise sur le marché', mst: "N° d'immatriculation", bct: 'Déclaré au ministère de l’Industrie et du Commerce',
            dong: 'Fermer', xemTrang: 'Voir la page produit', buoc: 'Étape', hopQua: 'Coffret 2 étapes', tang: 'Peigne de massage offert',
            formTieuDe: 'Offres & conseil gratuit', formPhu: 'Laissez votre numéro, nous vous rappelons aux heures d’ouverture.',
            ten: 'Nom', sdt: 'Téléphone', uuDai: 'Recevoir les offres', tuVan: 'Besoin de conseil', gui: 'Envoyer', dangGui: 'Envoi…',
            dongY: 'J’accepte que SPT LAB COMPANY LIMITED conserve mon nom et mon numéro pour me conseiller et m’envoyer des offres.',
            camOn: 'Merci ! Nous vous contactons bientôt.', loi: 'Envoi impossible. Écrivez-nous ou appelez :', thuLai: 'Envoi impossible, réessayez dans quelques minutes.',
            loiTen: 'Indiquez votre nom', loiSdt: 'Numéro incorrect', loiDongY: 'Cochez la case pour accepter',
            xemDayDu: 'Appuyez pour voir toutes les infos produit et les certificats', xemThem: 'Voir plus' },
        it: { chinhHang: 'Originale ROOT & RISE LAB', congDung: 'Benefici', cachDung: 'Modo d’uso', thanhPhan: 'Elenco completo degli ingredienti',
            luuY: 'Avvertenze', giayPhep: 'Certificati e licenze', tem: 'Sigilli anticontraffazione e di controllo', soCongBo: 'N. di notifica cosmetica',
            sanXuat: 'Prodotto da', phanPhoi: 'Responsabile dell’immissione in commercio', mst: 'N. di registro imprese', bct: 'Registrato presso il Ministero dell’Industria e del Commercio',
            dong: 'Chiudi', xemTrang: 'Vai alla pagina prodotto', buoc: 'Passo', hopQua: 'Confezione regalo in 2 passi', tang: 'Pettine massaggiante in omaggio',
            formTieuDe: 'Offerte e consulenza gratuita', formPhu: 'Lascia il tuo numero, ti richiamiamo in orario d’ufficio.',
            ten: 'Nome', sdt: 'Telefono', uuDai: 'Ricevi offerte', tuVan: 'Vorrei un consiglio', gui: 'Invia', dangGui: 'Invio…',
            dongY: 'Acconsento che SPT LAB COMPANY LIMITED conservi nome e numero per contattarmi con consigli e offerte.',
            camOn: 'Grazie! Ti contatteremo presto.', loi: 'Invio non riuscito. Scrivici o chiamaci:', thuLai: 'Invio non riuscito, riprova tra qualche minuto.',
            loiTen: 'Inserisci il nome', loiSdt: 'Numero non valido', loiDongY: 'Spunta la casella per acconsentire',
            xemDayDu: 'Tocca per vedere tutte le info sul prodotto e i certificati', xemThem: 'Vedi altro' },
        ja: { chinhHang: 'ROOT & RISE LAB 正規品', congDung: '効果', cachDung: '使い方', thanhPhan: '全成分',
            luuY: '使用上の注意', giayPhep: '認証・許可', tem: '偽造防止・検査シール', soCongBo: '化粧品届出番号',
            sanXuat: '製造所', phanPhoi: '製造販売元', mst: '法人番号', bct: '商工省届出済み',
            dong: '閉じる', xemTrang: '商品ページを見る', buoc: 'ステップ', hopQua: '2ステップ ギフトボックス', tang: '頭皮マッサージコーム付き',
            formTieuDe: '特典・無料相談', formPhu: '電話番号を残していただければ、営業時間内にご連絡します。',
            ten: 'お名前', sdt: '電話番号', uuDai: '特典を受け取る', tuVan: '相談したい', gui: '送信', dangGui: '送信中…',
            dongY: 'SPT LAB COMPANY LIMITED が相談・特典のご連絡のため、氏名と電話番号を保存することに同意します。',
            camOn: 'ありがとうございます。まもなくご連絡します。', loi: '送信できませんでした。こちらからご連絡ください：', thuLai: '送信できませんでした。数分後にもう一度お試しください。',
            loiTen: 'お名前を入力してください', loiSdt: '電話番号が正しくありません', loiDongY: '同意にチェックしてください',
            xemDayDu: 'タップして商品情報と認証をすべて見る', xemThem: 'もっと見る' }
    };
    const t = Object.assign({}, T.vi, T[L] || {});

    /* ================================================================
       1. ĐẾM LƯỢT VÀO — gửi một lần mỗi lần mở trang
       ================================================================ */
    function nguonVao() {
        if (QR) return 'qr';
        const u = (tham.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (u) return u.slice(0, 30);
        if (tham.get('fbclid')) return 'facebook';
        if (tham.get('gclid')) return 'google';
        if (tham.get('ttclid')) return 'tiktok';
        if (tham.get('zarsrc')) return 'zalo';
        let host = '';
        try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { }
        if (!host || host === location.hostname.replace(/^www\./, '')) return 'truc-tiep';
        const MAP = [['facebook', /facebook|fb\.|messenger/], ['instagram', /instagram/], ['tiktok', /tiktok/], ['zalo', /zalo/],
            ['google', /google\./], ['youtube', /youtube|youtu\.be/], ['coccoc', /coccoc/], ['bing', /bing\./], ['shopee', /shopee/], ['threads', /threads\./]];
        const m = MAP.find(([, re]) => re.test(host));
        return m ? m[0] : host.slice(0, 30);
    }
    const SID = (() => {
        try {
            let s = sessionStorage.getItem('rr_sid');
            if (!s) { s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); sessionStorage.setItem('rr_sid', s); }
            return s;
        } catch (e) { return 'x' + Math.random().toString(36).slice(2, 10); }
    })();
    /* nguồn được nhớ trong phiên — khách tải lại trang vẫn tính đúng nguồn ban đầu */
    const SRC = (() => { try { const c = sessionStorage.getItem('rr_src'); if (c && !QR) return c; const n = nguonVao(); sessionStorage.setItem('rr_src', n); return n; } catch (e) { return nguonVao(); } })();
    let MODEL = '';
    async function layModel() {
        try {
            if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
                const v = await navigator.userAgentData.getHighEntropyValues(['model']);
                MODEL = (v && v.model) || '';
            }
        } catch (e) { }
    }
    const laXemTruoc = tham.has('preview');
    async function ghiLuot() {
        if (laXemTruoc) return;
        await layModel();
        const body = JSON.stringify({ sid: SID, path: location.pathname, src: SRC, qr: QR || null,
            ref: (() => { try { return document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { return ''; } })(),
            lang: L, model: MODEL });
        try {
            if (navigator.sendBeacon && navigator.sendBeacon('/api/t', new Blob([body], { type: 'application/json' }))) return;
        } catch (e) { }
        try { fetch('/api/t', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => { }); } catch (e) { }
    }
    window.__rr = { SID, SRC, QR };

    /* ================================================================
       2. POPUP SẢN PHẨM
       ================================================================ */
    /* ================================================================
       BỘ DỰNG POPUP — tách riêng thành một hàm để TRANG QUẢN TRỊ dùng lại
       được với nội dung đang sửa (bản nháp trong máy), thay vì phải viết
       lại lần thứ hai rồi hai bên lệch nhau.
       Gọi: ROOTLAB_POPUP.boDung(nộiDung, 'vi') → { t, timMa, dung, form }
       ================================================================ */
    function boDung(Cx, L) {
        const t = Object.assign({}, T.vi, T[L] || {});
        const products = Cx.products || [];
        const lines = Cx.lines || [];
        const lk = Cx.contact || {};

        function timMa(ma) {
            if (!ma) return null;
            const p = products.find(x => (x.qr || '').toLowerCase() === ma);
            if (p) return { loai: 'chai', sp: p };
            const d = lines.find(x => (x.qr || '').toLowerCase() === ma);
            if (d) {
                const ds = (d.sp || []).map(k => products.find(p => p.key === k)).filter(Boolean);
                if (ds.length) return { loai: 'bo', dong: d, ds };
            }
            return null;
        }

        const doan = (tieuDe, noiDung, mo = false, lop = '') => noiDung ? `
            <details class="rp-doan ${lop}"${mo ? ' open' : ''}><summary><span>${h(tieuDe)}</span><i></i></summary>
            <div class="rp-than">${noiDung}</div></details>` : '';
        const doanVan = s => String(s || '').split(/\n+/).filter(Boolean).map(x => `<p>${h(x)}</p>`).join('');

        function giayPhep(p) {
            const r = [];
            if (p.cbmp) r.push([t.soCongBo, p.cbmp]);
            if (lk.factory) r.push([t.sanXuat, lk.factory]);
            if (lk.company) r.push([t.phanPhoi, lk.company + (lk.addressFull ? ' — ' + lk.addressFull : '')]);
            if (lk.taxCode) r.push([t.mst, lk.taxCode]);
            let html = r.map(([k, v]) => `<div class="rp-hang"><span>${h(k)}</span><b>${h(v)}</b></div>`).join('');
            (p.certs || []).filter(Boolean).forEach(c => { html += `<div class="rp-chip">✓ ${h(c)}</div>`; });
            if (lk.moit) html += `<a class="rp-chip rp-bct" href="${h(lk.moit)}" target="_blank" rel="noopener nofollow">✓ ${h(t.bct)}</a>`;
            return html;
        }
        function tem(p) {
            const ds = (p.stamps || []).filter(x => x && (x.img || x.src));
            if (!ds.length) return '';
            return `<div class="rp-tem">${ds.map(x => `<figure><img src="${h(x.img || x.src)}" alt="${h(x.label || '')}" loading="lazy"><figcaption>${h(x.label || '')}</figcaption></figure>`).join('')}</div>`;
        }
        function khoiChai(p) {
            return doan(t.congDung, doanVan(p.func || p.desc), true)
                + doan(t.cachDung, doanVan(p.use), true)
                + doan(t.thanhPhan, p.inci ? `<p class="rp-inci">${h(p.inci)}</p>` : '')
                + doan(t.luuY, doanVan(p.warn))
                + doan(t.giayPhep, giayPhep(p), true, 'rp-gp')
                + doan(t.tem, tem(p), true);
        }
        const dauChai = (p, nhan = true, gia = true) => `
            ${nhan ? `<span class="rp-nhan"><svg class="rp-vr" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#1877f2" d="M12.0 3.6Q15.5 -1.1 16.2 4.7Q21.6 2.4 19.3 7.8Q25.1 8.5 20.4 12.0Q25.1 15.5 19.3 16.2Q21.6 21.6 16.2 19.3Q15.5 25.1 12.0 20.4Q8.5 25.1 7.8 19.3Q2.4 21.6 4.7 16.2Q-1.1 15.5 3.6 12.0Q-1.1 8.5 4.7 7.8Q2.4 2.4 7.8 4.7Q8.5 -1.1 12.0 3.6Z"/><path fill="#fff" d="M10.6 15.4 7.4 12.2l1.5-1.5 1.7 1.7 4.5-4.5 1.5 1.5z"/></svg><b>${h(t.chinhHang)}</b></span>` : ''}
            <div class="rp-dau">
                <div class="rp-anh">${p.photo ? `<img src="${h(p.photo)}" alt="${h(p.name)}">` : ''}</div>
                <div class="rp-ten">
                    <h2 id="rp-td">${h(p.name)}</h2>
                    <p>${h(p.priceSub || '')}</p>
                    ${p.vol && !(p.priceSub || '').includes(p.vol.replace(/\s/g, '')) && !(p.priceSub || '').includes(p.vol) ? `<p class="rp-vol">${h(p.vol)}</p>` : ''}
                    ${gia && p.price ? `<div class="rp-gia">${h(p.price)}<small>đ</small></div>` : ''}
                </div>
            </div>`;

        /* huy chương vàng "Bán chạy nhất" — vẽ bằng SVG riêng (không dùng ảnh stock có bản quyền):
           viền răng cưa kiểu con dấu vàng + vòng chữ R + 2 dải ruy băng đỏ + ánh sáng lướt qua. */
        function vienRangCua(cx, cy, rNgoai, songs, rTrongTru) {
            let d = '';
            const step = (Math.PI * 2) / songs;
            for (let i = 0; i < songs; i++) {
                const a0 = i * step - Math.PI / 2, a1 = a0 + step, mid = (a0 + a1) / 2;
                const xOuterMid = cx + rNgoai * Math.cos(mid), yOuterMid = cy + rNgoai * Math.sin(mid);
                const xStart = cx + rTrongTru * Math.cos(a0), yStart = cy + rTrongTru * Math.sin(a0);
                const xEnd = cx + rTrongTru * Math.cos(a1), yEnd = cy + rTrongTru * Math.sin(a1);
                d += (i === 0 ? `M${xStart.toFixed(2)},${yStart.toFixed(2)} ` : '') +
                    `Q${xOuterMid.toFixed(2)},${yOuterMid.toFixed(2)} ${xEnd.toFixed(2)},${yEnd.toFixed(2)} `;
            }
            return d + 'Z';
        }
        function ngoiSao(cx, cy, rNgoai, rTrong, canh) {
            let d = '';
            for (let i = 0; i < canh * 2; i++) {
                const r = i % 2 === 0 ? rNgoai : rTrong;
                const a = (Math.PI * i / canh) - Math.PI / 2;
                d += (i === 0 ? 'M' : 'L') + (cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2) + ' ';
            }
            return d + 'Z';
        }
        function vongChuR(cx, cy, r, soLuong) {
            let out = '';
            for (let i = 0; i < soLuong; i++) {
                const a = (Math.PI * 2 * i) / soLuong - Math.PI / 2;
                const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a) + 1.9;
                out += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="5.6" fill="#4a2f0c" opacity=".82">R</text>`;
            }
            return out;
        }
        function medal(text) {
            const cx = 50, cy = 50;
            const outer = vienRangCua(cx, cy, 46, 20, 40.5);
            const ribbonTrai = 'M44,86 L54,86 L38,150 L46,138 L20,150 Z';
            const ribbonPhai = 'M56,86 L46,86 L62,150 L54,138 L80,150 Z';
            return `<div class="rp-medal">
                <span class="rp-spark s1">✦</span><span class="rp-spark s2">✦</span><span class="rp-spark s3">✦</span>
                <svg viewBox="0 0 100 150" class="rp-medal-svg" aria-hidden="true" focusable="false">
                    <defs>
                        <radialGradient id="rpGgFace" cx="35%" cy="28%" r="80%">
                            <stop offset="0%" stop-color="#fff8e2"/><stop offset="45%" stop-color="#ffcf4d"/><stop offset="100%" stop-color="#c98a1f"/>
                        </radialGradient>
                        <linearGradient id="rpGgRibbon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#d94a5e"/><stop offset="100%" stop-color="#7a1626"/>
                        </linearGradient>
                        <linearGradient id="rpGgText" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fff8e2"/><stop offset="55%" stop-color="#ffcf4d"/><stop offset="100%" stop-color="#d99a2b"/>
                        </linearGradient>
                        <clipPath id="rpGgClip"><path d="${outer}"/></clipPath>
                    </defs>
                    <path d="${ribbonPhai}" fill="url(#rpGgRibbon)"/>
                    <path d="${ribbonTrai}" fill="url(#rpGgRibbon)"/>
                    <path d="${outer}" fill="url(#rpGgFace)" stroke="#a8721f" stroke-width="1.2"/>
                    <circle cx="${cx}" cy="${cy}" r="37.4" fill="none" stroke="#a8721f" stroke-width=".7" opacity=".6"/>
                    <circle cx="${cx}" cy="${cy}" r="35.6" fill="none" stroke="#a8721f" stroke-width=".7" opacity=".6"/>
                    ${vongChuR(cx, cy, 40.5, 13)}
                    <path d="${ngoiSao(24, 34, 2.6, 1.1, 5)}" fill="#4a2f0c"/>
                    <path d="${ngoiSao(35, 28, 3.4, 1.5, 5)}" fill="#4a2f0c"/>
                    <path d="${ngoiSao(50, 25, 5.5, 2.4, 5)}" fill="#4a2f0c"/>
                    <path d="${ngoiSao(65, 28, 3.4, 1.5, 5)}" fill="#4a2f0c"/>
                    <path d="${ngoiSao(76, 34, 2.6, 1.1, 5)}" fill="#4a2f0c"/>
                    <text x="50" y="61.2" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="12" letter-spacing="-.3" fill="#3a2408" opacity=".85">${h(text)}</text>
                    <text x="50" y="60" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="12" letter-spacing="-.3" fill="url(#rpGgText)" stroke="#5c3a12" stroke-width=".4" paint-order="stroke">${h(text)}</text>
                    <g clip-path="url(#rpGgClip)"><rect x="-20" y="0" width="18" height="100" fill="rgba(255,255,255,.65)" class="rp-medal-sweep"/></g>
                </svg>
            </div>`;
        }

        /* mục "xem đầy đủ" gộp chung cho cả hộp quà: đóng lại mặc định, bên dưới hé lộ
           2-3 dòng nội dung thật mờ dần xuống để khách biết còn nội dung mà bấm vào xem tiếp
           (không lặp lại từng mục Công dụng/Cách dùng riêng cho mỗi chai như trước nữa). */
        function khoiChaiGop(ds) {
            let noiDung = ds.map((p, i) => `
                <h5 class="rp-buoc-nhan-gop">${h(t.buoc)} ${i + 1} · ${h(p.name)}</h5>
                <div class="rp-sec"><h4>${h(t.congDung)}</h4>${doanVan(p.func || p.desc)}</div>
                <div class="rp-sec"><h4>${h(t.cachDung)}</h4>${doanVan(p.use)}</div>
                ${p.inci ? `<div class="rp-sec"><h4>${h(t.thanhPhan)}</h4><p class="rp-inci">${h(p.inci)}</p></div>` : ''}
                ${p.warn ? `<div class="rp-sec"><h4>${h(t.luuY)}</h4>${doanVan(p.warn)}</div>` : ''}
            `).join('');
            const gp = giayPhep(ds[0] || {});
            if (gp) noiDung += `<div class="rp-sec"><h4>${h(t.giayPhep)}</h4>${gp}</div>`;
            const temHtml = ds.map(p => tem(p)).join('');
            if (temHtml) noiDung += `<div class="rp-sec"><h4>${h(t.tem)}</h4>${temHtml}</div>`;
            const p0 = ds[0] || {};
            const peek = h(String((p0.func || p0.desc || '') + ' ' + (p0.use || '')).trim());
            return `<details class="rp-doan rp-doan-gop"><summary><span>${h(t.xemDayDu)}</span><i></i></summary>
                <div class="rp-than">${noiDung}</div></details>
                <div class="rp-peek" id="rpPeek"><p>${peek}</p><span class="rp-peek-goi">▾ ${h(t.xemThem)}</span></div>`;
        }

        /* tên tiếng Việt gốc — lưu vào danh sách khách cho Phil đọc, dù khách đang xem tiếng nào */
        const GOC = window.ROOTLAB_CONTENT || Cx;
        const tenGoc = key => ((GOC.products || []).find(p => p.key === key) || {}).name || key;
        function dung(k) {
            if (k.loai === 'chai') return { tieuDe: k.sp.name, sanPham: tenGoc(k.sp.key), html: dauChai(k.sp) + khoiChai(k.sp), dich: k.sp.key };
            const d = k.dong, pr = Object.assign({}, Cx.pricing || {}, d.pricing || {});
            /* ảnh hộp: mặt có cửa sổ thấy sản phẩm ↔ góc nghiêng — tự đổi qua lại, không xoay ảnh phẳng
               (xem rootlab-landing/doi-chai-khong-duoc-xoay.md — lùi mờ ra xa rồi tiến rõ lại gần) */
            const hopMat1 = pr.boxPhoto || 'hop-qua-2buoc.webp', hopMat2 = pr.boxPhotoGoc || 'hop-qua-goc-nghieng.webp';
            /* v12: một khối ảnh lớn duy nhất tự đổi mặt — không còn dải chai chạy trang trí bên dưới nữa */
            const dau = `
                <div class="rp-hero">
                    ${pr.boxBadge ? medal(pr.boxBadge) : ''}
                    <div class="rp-hero-stage">
                        <span class="rp-brand"><img src="r-logo.png" alt=""></span>
                        <div class="rp-hero-img">
                            <img class="hf" src="${h(hopMat1)}" alt="">
                            <img class="hb" src="${h(hopMat2)}" alt="">
                        </div>
                        <div class="rp-hero-dots"><i class="on"></i><i></i></div>
                    </div>
                </div>
                <span class="rp-nhan"><svg class="rp-vr" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#1877f2" d="M12.0 3.6Q15.5 -1.1 16.2 4.7Q21.6 2.4 19.3 7.8Q25.1 8.5 20.4 12.0Q25.1 15.5 19.3 16.2Q21.6 21.6 16.2 19.3Q15.5 25.1 12.0 20.4Q8.5 25.1 7.8 19.3Q2.4 21.6 4.7 16.2Q-1.1 15.5 3.6 12.0Q-1.1 8.5 4.7 7.8Q2.4 2.4 7.8 4.7Q8.5 -1.1 12.0 3.6Z"/><path fill="#fff" d="M10.6 15.4 7.4 12.2l1.5-1.5 1.7 1.7 4.5-4.5 1.5 1.5z"/></svg><b>${h(t.chinhHang)}</b></span>
                <div class="rp-ten rp-ten-bo">
                    <h2 id="rp-td">${h(pr.boxEyebrow ? t.hopQua : (d.name || t.hopQua))}</h2>
                    <p>${h(k.ds.map(p => p.name).join(' + '))}</p>
                    ${pr.comboNew ? `<div class="rp-gia">${h(pr.comboNew)}${pr.comboOld ? ` <s>${h(pr.comboOld)}</s>` : ''}</div>` : ''}
                    <p class="rp-tang">★ ${h(pr.boxGift || t.tang)}</p>
                </div>`;
            /* v12: không còn tab Bước 1/Bước 2, không còn hiện riêng ảnh+tên từng chai nữa —
               đi thẳng từ giá xuống một mục "xem đầy đủ" duy nhất, đóng sẵn, hé lộ vài dòng mờ dần. */
            return { tieuDe: t.hopQua, sanPham: T.vi.hopQua, html: dau + khoiChaiGop(k.ds), dich: d.key };
        }

        function form(sanPham) {
            const zalo = lk.zalo ? (/^https?:/i.test(lk.zalo) ? lk.zalo : 'https://zalo.me/' + String(lk.zalo).replace(/[^\d]/g, '')) : '';
            const lienHe = [zalo ? `<a href="${h(zalo)}" target="_blank" rel="noopener">Zalo</a>` : '',
                lk.phone ? `<a href="tel:${h(String(lk.phone).replace(/[^\d+]/g, ''))}">${h(lk.phone)}</a>` : ''].filter(Boolean).join(' · ');
            return `
            <form class="rp-form" novalidate data-sp="${h(sanPham)}" data-lh="${h(lienHe)}">
                <h3>${h(t.formTieuDe)}</h3><p class="rp-phu">${h(t.formPhu)}</p>
                <div class="rp-chon">
                    <label><input type="radio" name="need" value="uu-dai" checked><span>${h(t.uuDai)}</span></label>
                    <label><input type="radio" name="need" value="tu-van"><span>${h(t.tuVan)}</span></label>
                </div>
                <label class="rp-o"><span>${h(t.ten)}</span><input name="name" autocomplete="name" maxlength="80" required></label>
                <label class="rp-o"><span>${h(t.sdt)}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" required></label>
                <input class="rp-bay" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">
                <label class="rp-dy"><input type="checkbox" name="consent"><span>${h(t.dongY)}</span></label>
                <div class="rp-bao" role="status" aria-live="polite"></div>
                <button type="submit" class="rp-gui">${h(t.gui)}</button>
            </form>`;
        }
        return { t, timMa, dung, form, khoiChai, dauChai };
    }

    const BO = boDung(Cx, L);
    const { timMa, dung, form } = BO;

    let lopPhu = null, truocDo = null, heroTimer = null;
    function mo(ma) {
        const k = timMa(ma);
        if (!k) return false;
        const v = dung(k);
        truocDo = document.activeElement;
        lopPhu = document.createElement('div');
        lopPhu.className = 'rp-nen';
        lopPhu.innerHTML = `
            <div class="rp-hop" role="dialog" aria-modal="true" aria-labelledby="rp-td">
                <button type="button" class="rp-x" aria-label="${h(t.dong)}">×</button>
                <div class="rp-cuon">${v.html}${form(v.sanPham)}
                    <button type="button" class="rp-xem">${h(t.xemTrang)} →</button>
                </div>
            </div>`;
        document.body.appendChild(lopPhu);
        document.body.classList.add('pop-mo');
        requestAnimationFrame(() => lopPhu.classList.add('hien'));

        /* đưa trang phía sau về đúng dòng sản phẩm — tắt popup là thấy ngay */
        try { if (typeof rootlabGoto === 'function') rootlabGoto(v.dich); } catch (e) { }
        try { const home = document.getElementById('home'); if (home) window.scrollTo(0, home.offsetTop); } catch (e) { }

        lopPhu.addEventListener('click', e => { if (e.target === lopPhu) dong(); });
        $('.rp-x', lopPhu).addEventListener('click', dong);
        $('.rp-xem', lopPhu).addEventListener('click', dong);
        /* mục "xem đầy đủ" gộp — bấm vào khu vực hé lộ mờ cũng mở accordion ra luôn */
        const rpDoanGop = $('.rp-doan-gop', lopPhu), rpPeek = $('.rp-peek', lopPhu);
        if (rpDoanGop && rpPeek) rpPeek.addEventListener('click', () => { rpDoanGop.open = true; });
        ganForm($('.rp-form', lopPhu));
        setTimeout(() => $('.rp-x', lopPhu)?.focus(), 60);

        /* hộp quà tự đổi mặt — chỉ chạy khi popup này có khối .rp-hero (không có ở popup xem 1 chai riêng) */
        const hero = $('.rp-hero', lopPhu);
        const chamMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (hero && !chamMotion) {
            const cham = [...lopPhu.querySelectorAll('.rp-hero-dots i')];
            heroTimer = setInterval(() => {
                const lat = hero.classList.toggle('lat');
                cham.forEach((c, i) => c.classList.toggle('on', (i === 1) === lat));
            }, 3200);
        }

        return true;
    }
    function dong() {
        if (!lopPhu) return;
        if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
        const x = lopPhu; lopPhu = null;
        x.classList.remove('hien');
        document.body.classList.remove('pop-mo');
        setTimeout(() => x.remove(), 260);
        try { truocDo && truocDo.focus && truocDo.focus(); } catch (e) { }
        /* bỏ ?qr khỏi địa chỉ để tải lại trang không bật popup lần nữa */
        try { const u = new URL(location.href); u.searchParams.delete('qr'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); } catch (e) { }
    }
    document.addEventListener('keydown', e => {
        if (!lopPhu) return;
        if (e.key === 'Escape') { e.preventDefault(); dong(); }
        if (e.key === 'Tab') {             /* giữ phím Tab chạy vòng bên trong popup */
            const ds = [...lopPhu.querySelectorAll('button, a[href], input:not(.rp-bay), summary')].filter(x => x.offsetParent);
            if (!ds.length) return;
            const dau = ds[0], cuoi = ds[ds.length - 1];
            if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi.focus(); }
            else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau.focus(); }
        }
    });

    function ganForm(f) {
        if (!f) return;
        const bao = $('.rp-bao', f), nut = $('.rp-gui', f);
        /* dùng f.elements[...] — f.name là thuộc tính riêng của thẻ form, không phải ô "Họ tên" */
        const o = n => f.elements.namedItem(n);
        const bao1 = (s, loai = 'loi', coHtml = false) => { bao.className = 'rp-bao ' + loai; if (coHtml) bao.innerHTML = s; else bao.textContent = s; };

        /* CHƯA TICK ĐỒNG Ý thì nút Gửi tắt hẳn — luật dữ liệu cá nhân bắt buộc
           phải có sự đồng ý trước, và để nút sáng rồi mới báo lỗi thì khách bực. */
        const oDy = o('consent');
        const khoaNut = () => {
            const duoc = !!(oDy && oDy.checked);
            nut.disabled = !duoc;
            nut.classList.toggle('khoa', !duoc);
            nut.title = duoc ? '' : t.loiDongY;
            if (duoc && bao.textContent === t.loiDongY) bao1('', '');
        };
        if (oDy) oDy.addEventListener('change', khoaNut);
        khoaNut();

        /* số điện thoại: chỉ nhận chữ số khi gõ (giữ dấu + ở đầu nếu khách gõ dạng +84…) */
        const oSdt = o('phone');
        if (oSdt) oSdt.addEventListener('input', () => { oSdt.value = oSdt.value.replace(/(?!^\+)[^\d]/g, ''); });

        f.addEventListener('submit', async e => {
            e.preventDefault();
            const name = o('name').value.trim();
            const phone = o('phone').value.replace(/[^\d+]/g, '');
            if (name.length < 2) return bao1(t.loiTen), o('name').focus();
            if (!/^(\+?84|0)\d{9,10}$/.test(phone)) return bao1(t.loiSdt), o('phone').focus();
            if (!o('consent').checked) return bao1(t.loiDongY);
            nut.disabled = true; nut.textContent = t.dangGui; bao1('', '');
            const body = { name, phone, need: o('need').value, product: f.dataset.sp, qr: QR || null, src: SRC, lang: L,
                consent: true, consentText: t.dongY, web: o('web').value, model: MODEL };
            let ok = false, loiMay = false;
            try {
                const r = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
                const j = await r.json().catch(() => ({}));
                ok = r.ok && j.ok;
                if (!ok && j.err === 'sdt') { nut.disabled = false; nut.textContent = t.gui; return bao1(t.loiSdt); }
                loiMay = !ok;
            } catch (err) { loiMay = true; }
            if (ok) {
                f.innerHTML = `<div class="rp-xong"><b>✓</b><p>${h(t.camOn)}</p></div>`;
                return;
            }
            nut.disabled = false; nut.textContent = t.gui;
            const lh = f.dataset.lh;
            bao1(lh ? h(t.loi) + ' ' + lh : h(t.thuLai), 'loi', true);
        });
    }

    /* ---------- giao diện popup ---------- */
    const css = document.createElement('style');
    const CSS = `
    body.pop-mo{overflow:hidden}
    .rp-nen{position:fixed;inset:0;z-index:9999;background:rgba(6,20,17,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity .25s ease}
    .rp-nen.hien{opacity:1}
    .rp-hop{position:relative;width:min(560px,100%);max-height:min(88vh,900px);background:#fbf8f3;color:#23201b;border-radius:24px;
      box-shadow:0 40px 90px -30px rgba(0,0,0,.6);overflow:hidden;display:flex;flex-direction:column;
      transform:translateY(18px) scale(.98);transition:transform .3s cubic-bezier(.2,.9,.25,1);font-family:var(--font-main,system-ui),system-ui,sans-serif}
    .rp-nen.hien .rp-hop{transform:none}
    .rp-cuon{overflow-y:auto;overscroll-behavior:contain;padding:26px 26px 22px;-webkit-overflow-scrolling:touch;
      scrollbar-width:none;-ms-overflow-style:none}
    /* giấu thanh cuộn cho gọn mắt — vẫn cuộn được bằng chuột, bằng ngón tay, bằng phím */
    .rp-cuon::-webkit-scrollbar{width:0;height:0;display:none}
    .rp-x{position:absolute;top:12px;right:12px;z-index:2;width:38px;height:38px;border-radius:50%;border:0;background:rgba(35,32,27,.08);
      color:#23201b;font-size:24px;line-height:1;cursor:pointer}
    .rp-x:hover{background:rgba(35,32,27,.15)}
    .rp-x:focus-visible,.rp-hop button:focus-visible,.rp-hop summary:focus-visible,.rp-hop input:focus-visible{outline:2px solid #0f6b5c;outline-offset:2px}
    .rp-dau{display:flex;gap:18px;align-items:center;margin:0 0 16px}
    .rp-anh{flex:0 0 108px;height:170px;display:flex;align-items:flex-end;justify-content:center;
      background:radial-gradient(90% 70% at 50% 60%,#efe3cf,#f7f1e8 72%);border-radius:18px;padding:10px}
    .rp-anh img{max-height:100%;max-width:100%;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(80,55,20,.25))}
    .rp-anh-bo{flex-basis:150px;height:130px;padding:0;background:none}
    .rp-anh-bo img{border-radius:12px;filter:drop-shadow(0 12px 18px rgba(80,55,20,.28))}
    /* ---- khối ảnh lớn của hộp quà: hộp tự đổi mặt (v12) ---- */
    .rp-hero{position:relative;margin:-26px -26px 16px}
    .rp-hero-stage{position:relative;height:300px;border-radius:20px;overflow:hidden;background:radial-gradient(120% 130% at 50% 12%,#fff8ea 0%,#f6e9cc 55%,#ecdcb4 100%);display:flex;align-items:center;justify-content:center;perspective:1200px}
    .rp-hero-img{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .rp-hero-img img{position:absolute;max-height:82%;max-width:74%;object-fit:contain;
      filter:drop-shadow(0 16px 16px rgba(60,40,10,.25));will-change:transform,opacity;
      transition:transform 1.1s cubic-bezier(.45,0,.2,1),opacity 1.1s cubic-bezier(.45,0,.2,1)}
    .rp-hero-img img.hf{opacity:1;transform:translateZ(0) scale(1)}
    .rp-hero-img img.hb{opacity:0;transform:translateZ(-260px) scale(.82)}
    .rp-hero.lat .rp-hero-img img.hf{opacity:0;transform:translateZ(-260px) scale(.82)}
    .rp-hero.lat .rp-hero-img img.hb{opacity:1;transform:translateZ(0) scale(1)}
    .rp-hero-dots{position:absolute;bottom:9px;left:0;right:0;display:flex;justify-content:center;gap:6px;z-index:2}
    .rp-hero-dots i{width:6px;height:6px;border-radius:50%;background:#d8c79a;transition:background .3s,transform .3s}
    .rp-hero-dots i.on{background:#5c3c0a;transform:scale(1.25)}
    .rp-medal{position:absolute;top:8px;left:10px;z-index:4;width:64px;height:96px;filter:drop-shadow(0 6px 10px rgba(50,30,0,.4))}
    .rp-medal-svg{width:100%;height:100%;display:block;overflow:visible}
    .rp-spark{position:absolute;color:#fff9dd;font-size:9px;line-height:1;pointer-events:none;
      text-shadow:0 0 4px #fff3c4,0 0 8px #ffd77a;animation:rpTwinkle 1.8s ease-in-out infinite}
    .rp-spark.s1{top:-2px;right:-5px;animation-delay:0s;font-size:10px}
    .rp-spark.s2{top:26%;left:-7px;animation-delay:.6s;font-size:7px}
    .rp-spark.s3{top:48%;right:-6px;animation-delay:1.15s;font-size:8px}
    @keyframes rpTwinkle{0%,100%{opacity:0;transform:scale(.3) rotate(0deg)}50%{opacity:1;transform:scale(1.15) rotate(25deg)}}
    .rp-medal-sweep{animation:rpSweepMedal 2.8s ease-in-out infinite}
    @keyframes rpSweepMedal{0%,20%{transform:translateX(-140%) rotate(18deg)}55%,100%{transform:translateX(140%) rotate(18deg)}}
    .rp-brand{position:absolute;bottom:9px;right:10px;z-index:2;width:32px;height:32px;border-radius:50%;background:#fff;
      display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(30,20,10,.18);overflow:hidden}
    .rp-brand img{width:46%;height:64%;object-fit:contain}
    .rp-ten-bo{padding:14px 2px 0}
    .rp-ten h2{margin:0 0 4px;font-size:22px;line-height:1.25;letter-spacing:-.01em}
    .rp-ten p{margin:0;color:#6b6358;font-size:14px;line-height:1.45}
    .rp-vol{margin-top:2px!important}
    .rp-nhan{display:inline-flex;align-items:center;gap:5px;max-width:100%;margin:0 46px 10px 0;
      font-size:10.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:#1a4f8a;
      background:#e8f0fb;padding:4px 10px 4px 6px;border-radius:99px}
    .rp-best{display:inline-flex;align-items:center;gap:5px;margin:0 8px 10px 0;font-size:10.5px;font-weight:800;
      letter-spacing:.03em;text-transform:uppercase;color:#7a3b00;background:linear-gradient(135deg,#ffd77a,#ffb347);
      padding:5px 12px;border-radius:99px;box-shadow:0 2px 6px rgba(255,150,20,.35)}
    /* một hàng, không ngắt dòng; khung hẹp quá thì tự thu chữ chứ không xuống dòng */
    .rp-nhan b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}
    .rp-vr{width:15px;height:15px;flex:none;display:block}
    .rp-gia{margin-top:8px;font-size:22px;font-weight:700;color:#23201b}
    .rp-gia small{font-size:14px;margin-left:1px}
    .rp-gia s{font-size:14px;font-weight:400;color:#9a9186;margin-left:6px}
    .rp-tang{margin-top:6px!important;color:#b5530b!important;font-weight:600}
    .rp-buoc .rp-dau{margin-top:2px}
    .rp-buoc>.rp-nhan{margin-right:0}
    .rp-buoc-nhan{margin:0 0 8px;font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#8b8276}
    .rp-buoc:not(:first-child){margin-top:16px;padding-top:16px;border-top:1px dashed #e7ded1}
    .rp-doan{border-top:1px solid #e7ded1}
    .rp-doan summary{list-style:none;display:flex;align-items:center;gap:10px;padding:14px 2px;cursor:pointer;font-weight:700;font-size:15px}
    .rp-doan summary::-webkit-details-marker{display:none}
    .rp-doan summary span{flex:1}
    .rp-doan summary i{width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #8b8276;transition:transform .2s}
    .rp-doan[open] summary i{transform:rotate(180deg)}
    .rp-than{padding:0 2px 14px;font-size:14.5px;line-height:1.65;color:#3b362f}
    .rp-than p{margin:0 0 8px}
    .rp-inci{font-size:12.5px!important;line-height:1.7!important;color:#6b6358}
    .rp-doan-gop{margin-top:2px}
    .rp-buoc-nhan-gop{font-size:13.5px;font-weight:700;color:#23201b;margin:16px 0 8px;padding-top:14px;border-top:1px dashed #e7ded1}
    .rp-buoc-nhan-gop:first-child{margin-top:0;padding-top:0;border-top:0}
    .rp-sec{margin-bottom:4px}
    .rp-sec h4{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#0f6b5c;margin:0 0 4px;font-weight:700}
    .rp-peek{position:relative;border:1px solid #e7ded1;border-top:none;border-radius:0 0 14px 14px;
      background:#fff;padding:10px 14px 14px;margin:-1px 0 4px;cursor:pointer;max-height:62px;overflow:hidden}
    .rp-doan-gop[open] ~ .rp-peek{display:none}
    .rp-peek p{font-size:13px;line-height:1.55;color:#5a5344;margin:0}
    .rp-peek::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34px;
      background:linear-gradient(to bottom, rgba(255,255,255,0), #fff 85%);pointer-events:none}
    .rp-peek-goi{position:absolute;left:0;right:0;bottom:3px;text-align:center;font-size:10.5px;
      color:#8b8276;font-weight:700;letter-spacing:.02em}
    .rp-hang{display:flex;flex-direction:column;gap:1px;padding:8px 0;border-bottom:1px dashed #e7ded1}
    .rp-hang:last-of-type{border-bottom:0}
    .rp-hang span{font-size:12px;color:#8b8276}
    .rp-hang b{font-weight:600;font-size:14px}
    .rp-chip{display:inline-flex;align-items:center;gap:6px;margin:8px 8px 0 0;padding:6px 11px;border-radius:99px;background:#e3f1ed;color:#0f6b5c;font-size:13px;font-weight:600;text-decoration:none}
    .rp-bct{background:#fbe9e9;color:#b42323}
    .rp-tem{display:flex;flex-wrap:wrap;gap:12px}
    .rp-tem figure{margin:0;width:120px;text-align:center}
    .rp-tem img{width:100%;border-radius:10px;border:1px solid #e7ded1;background:#fff}
    .rp-tem figcaption{font-size:12px;color:#6b6358;margin-top:4px}
    .rp-form{margin-top:10px;padding:18px;background:#fff;border:1px solid #e7ded1;border-radius:18px}
    .rp-form h3{margin:0 0 2px;font-size:17px}
    .rp-phu{margin:0 0 12px;color:#6b6358;font-size:13.5px}
    .rp-chon{display:flex;gap:8px;margin-bottom:12px}
    .rp-chon label{flex:1;cursor:pointer}
    .rp-chon input{position:absolute;opacity:0;pointer-events:none}
    .rp-chon span{display:block;text-align:center;padding:10px 6px;border:1px solid #ddd3c4;border-radius:12px;font-size:14px;font-weight:600;color:#6b6358}
    .rp-chon input:checked+span{border-color:#0f6b5c;background:#e3f1ed;color:#0f6b5c}
    .rp-chon input:focus-visible+span{outline:2px solid #0f6b5c;outline-offset:2px}
    .rp-o{display:block;margin-bottom:10px}
    .rp-o span{display:block;font-size:12.5px;color:#6b6358;margin-bottom:4px}
    .rp-o input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #ddd3c4;border-radius:12px;font:16px inherit;background:#fbf8f3;color:#23201b}
    .rp-bay{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}
    .rp-dy{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;line-height:1.5;color:#6b6358;cursor:pointer;margin:4px 0 10px}
    .rp-dy input{flex:none;width:18px;height:18px;margin-top:1px;accent-color:#0f6b5c}
    .rp-form:has(.rp-dy input:not(:checked)) .rp-dy{color:#4a463f}
    .rp-bao{min-height:0;font-size:13.5px;margin-bottom:8px}
    .rp-bao.loi{color:#b42323}
    .rp-bao a{color:#0f6b5c;font-weight:700}
    .rp-gui{width:100%;border:0;border-radius:14px;padding:14px;background:#0f6b5c;color:#fff;font:700 16px inherit;cursor:pointer}
    .rp-gui:disabled{opacity:.6;cursor:wait}
    .rp-gui.khoa{background:#cfc9bf;color:#fff;cursor:not-allowed;opacity:1}
    .rp-xong{text-align:center;padding:16px 4px}
    .rp-xong b{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#e3f1ed;color:#0f6b5c;font-size:22px}
    .rp-xong p{margin:10px 0 0;font-weight:600}
    .rp-xem{display:block;width:100%;margin-top:12px;border:1px solid #ddd3c4;background:none;border-radius:14px;padding:12px;font:600 15px inherit;color:#23201b;cursor:pointer}
    @media (max-width:600px){
      .rp-nen{padding:0;align-items:flex-end}
      .rp-hop{width:100%;max-height:92vh;border-radius:22px 22px 0 0}
      .rp-cuon{padding:22px 18px 18px}
      .rp-dau{gap:14px}
      .rp-anh{flex-basis:88px;height:140px}
      .rp-anh-bo{flex-basis:120px;height:104px}
      .rp-ten h2{font-size:19px}
      .rp-hero{margin:-22px -18px 16px}
      .rp-hero-stage{height:240px}
      .rp-medal{width:52px;height:78px;top:6px;left:8px}
      .rp-brand{width:28px;height:28px}
    }
    @media (prefers-reduced-motion:reduce){
      .rp-nen,.rp-hop{transition:none}
      .rp-hero-img img{transition:none}
      .rp-spark,.rp-medal-sweep{animation:none;opacity:0}
    }
    `;
    css.textContent = CSS;
    document.head.appendChild(css);

    /* ---------- chạy ---------- */
    window.rootlabPopup = { mo, dong };
    /* trang quản trị dùng lại bộ dựng + đúng bộ CSS này để xem thử popup */
    window.ROOTLAB_POPUP = { boDung, CSS, T };
    const batDau = () => {
        /* Trang quản trị cũng nạp file này để XEM THỬ popup — ở đó chỉ mượn bộ
           dựng, tuyệt đối không mở popup và không đếm lượt (kẻo Phil tự sửa
           trang lại thành khách vào web). */
        if (window.ROOTLAB_ADMIN) return;
        if (QR) { if (!mo(QR)) { /* mã lạ: mở web bình thường */ } }
        setTimeout(ghiLuot, 400);
    };
    if (document.readyState === 'complete') batDau(); else window.addEventListener('load', batDau);
})();
