/* Định vị khách theo quốc gia (Cloudflare tự cung cấp request.cf.country, miễn phí,
   không cần gọi API ngoài) rồi gắn sẵn ngôn ngữ gợi ý vào đầu trang, để script chọn
   ngôn ngữ trong index.html dùng — không đổi hành vi nếu khách đã từng chọn tay
   (?lang=... hoặc đã lưu trong localStorage), chỉ ảnh hưởng lần ghé đầu tiên.
   Ngoài 4 nước có bản dịch riêng thì mặc định tiếng Anh, không phải tiếng Việt. */
const NUOC_SANG_NGON_NGU = { VN: 'vi', FR: 'fr', IT: 'it', JP: 'ja' };

export async function onRequest(context) {
    const res = await context.next();
    const loaiNoiDung = res.headers.get('content-type') || '';
    if (!loaiNoiDung.includes('text/html')) return res;

    const quocGia = (context.request.cf && context.request.cf.country) || '';
    const ngonNgu = NUOC_SANG_NGON_NGU[quocGia] || 'en';

    class GhiNgonNgu {
        element(el) {
            el.prepend(
                `<script>window.ROOTLAB_GEO_LANG=${JSON.stringify(ngonNgu)};window.ROOTLAB_GEO_COUNTRY=${JSON.stringify(quocGia)};</script>`,
                { html: true }
            );
        }
    }
    return new HTMLRewriter().on('head', new GhiNgonNgu()).transform(res);
}
