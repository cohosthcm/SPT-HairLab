/* sptlab.co/q/bo-doi → sptlab.co/?qr=bo-doi (đường tắt; mã QR in trên hộp dùng thẳng dạng ?qr=) */
export function onRequestGet({ params, request }) {
    const code = String(params.code || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    return Response.redirect(new URL('/?qr=' + code, request.url).toString(), 302);
}
