# ROOTLAB — landing page + trang quản trị

Trang tĩnh, **không cần build, không cần npm install**. Vercel nhận diện là Static và deploy thẳng.

## Các file

| File | Việc của nó |
|---|---|
| `index.html` | Trang chính: 6 màn cuộn, hai chai 3D dựng bằng CSS |
| `admin.html` | **Trang sửa nội dung** — mở bằng trình duyệt là dùng được |
| `content.js` | Toàn bộ chữ, giá, màu chai, ảnh chai. Đây là file admin xuất ra |
| `og.png` | Ảnh hiện lên khi chia sẻ link |
| `vercel.json`, `robots.txt`, `sitemap.xml` | Cache, header, SEO |

---

## Sửa nội dung bằng trang admin

Mở `admin.html` (nhấp đúp file, hoặc vào `tên-miền/admin.html` sau khi deploy).

Bên trái là các ô nhập, bên phải là trang thật — sửa tới đâu thấy ngay tới đó.

**Sửa được những gì**

- Tên thương hiệu, chữ trên menu, chữ mọi nút bấm, chân trang
- Tiêu đề lớn, mô tả, dòng cam kết ở màn đầu
- Với từng sản phẩm: tên, mô tả, **chữ in trên thân chai 3D**, **màu thân chai / nắp chai / chữ nhãn**, **màu nền của màn đó**, giá, các gạch đầu dòng, link nút mua
- **Thay chai 3D bằng ảnh chai thật** — tải ảnh PNG nền trong suốt lên
- Danh sách thành phần, các bước dùng, mốc thời gian, ô số liệu, đánh giá khách hàng: thêm / xoá / đổi thứ tự thoải mái

**Quy trình**

1. Sửa trong `admin.html` — mọi thay đổi tự lưu tạm trong trình duyệt
2. Bấm **Tải content.js**
3. Thay file `content.js` cũ bằng file vừa tải
4. Đưa lên Vercel (kéo thả lại, hoặc commit lên GitHub) → trang cập nhật

> Bản nháp trong trình duyệt chỉ hiện ở ô xem trước của admin. Khách vào trang thật vẫn thấy nội dung trong `content.js` cho tới khi bạn thay file.

**Về ảnh chai thật:** khi dùng ảnh, hiệu ứng xoay 360° sẽ tự tắt (ảnh phẳng mà xoay sẽ bị dẹt như tấm bìa), thay bằng hiệu ứng loé sáng. Ảnh được tự thu về cao 900px để file không phình. Nếu `content.js` vượt 400 KB, admin sẽ cảnh báo.

---

## Đưa lên Vercel

**Cách 1 — kéo thả (2 phút, không cần GitHub)**

1. Vào https://vercel.com/new
2. Kéo nguyên thư mục này thả vào
3. Bấm **Deploy**

**Cách 2 — sửa code thẳng trên trình duyệt (nên dùng)**

1. Tạo repo tại https://github.com/new, tên `rootlab`, để Public
2. Bấm **uploading an existing file** → kéo hết file vào → Commit
3. https://vercel.com/new → Import repo → Deploy
4. Muốn sửa code: mở repo trên GitHub, **bấm phím `.`** → hiện VS Code ngay trong trình duyệt → sửa → Commit & Push → Vercel tự cập nhật sau ~20 giây

Muốn giấu trang admin khỏi người lạ: xoá `admin.html` khỏi thư mục trước khi deploy, giữ bản trên máy để sửa rồi chỉ upload `content.js`.

## Đổi tên miền

Vercel → Project → **Settings → Domains**. Sau đó thay `rootlab.vercel.app` bằng tên miền thật trong `index.html` (thẻ canonical) và `sitemap.xml`.

## Còn cần làm trước khi bán thật

- Thay số liệu Hiệu quả (89% / 3,2× / 12 tuần) bằng khảo sát thật
- Thay 4 đánh giá mẫu bằng phản hồi thật của khách
- Điền **link nút mua** cho từng sản phẩm trong admin (giỏ hàng, Shopee, hoặc form đặt hàng)
