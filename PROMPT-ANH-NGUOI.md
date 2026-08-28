# ROOTLAB — Bộ prompt tạo 6 ảnh người mẫu cho màn đầu

Viết prompt bằng **tiếng Anh** vì model tạo ảnh được huấn luyện gần như toàn bộ trên chú thích tiếng Anh — prompt tiếng Việt cho ra kết quả kém hơn thấy rõ. Phần giải thích để tiếng Việt.

---

## ⚠️ Đọc phần này trước, nó quan trọng hơn cả prompt

6 tấm ảnh này sẽ **hoán đổi cho nhau ngay tại một chỗ** trên web. Nếu khung hình, khoảng cách, ánh sáng hay nền lệch nhau, lúc đổi người sẽ thấy giật và rẻ tiền — dù từng tấm riêng lẻ đều đẹp.

**Cách làm đúng:**

1. Tạo **tấm số 1** trước. Chỉnh tới khi thật ưng.
2. **5 tấm còn lại đừng tạo từ đầu.** Dùng tấm 1 làm ảnh gốc:
   - Midjourney → thêm `--sref <link ảnh 1>` (khoá phong cách)
   - Nano Banana / Flux Kontext → tải ảnh 1 lên rồi bảo "giữ nguyên bố cục, ánh sáng và nền, đổi người mẫu thành…"
   - Sora / GPT Image → đính ảnh 1 kèm câu "same framing, lighting and background as the reference"
3. Xuất tất cả **cùng tỉ lệ 3:4**, cùng kích thước.

Không làm bước 2 thì gần như chắc chắn 6 tấm sẽ lệch nhau.

---

## Prompt nền (dùng cho tấm số 1)

```
Editorial beauty portrait of a young East Asian woman with very long, glossy,
mirror-smooth dark brown hair falling past her chest. Centred frontal composition,
waist-up, subject facing camera with a calm neutral expression, eyes toward lens.
Soft large-source studio lighting from the front-left, gentle falloff, no hard
shadows, subtle rim light separating hair from background. Seamless warm cream
beige backdrop, completely plain, no props. Muted natural colour palette, warm
skin tones, low contrast, matte finish. Shot on 85mm lens, shallow depth of field,
background softly out of focus, fine natural skin texture retained. Minimal clean
beauty-campaign mood.
```

**Tham số Midjourney:** `--ar 3:4 --style raw --stylize 250`

**Negative prompt** (chỉ Stable Diffusion / SDXL cần):
```
text, watermark, logo, harsh shadows, heavy makeup, cluttered background,
plastic skin, oversharpened, extra fingers, distorted hands, busy patterns
```

---

## 5 prompt còn lại — dán thẳng, không phải ghép

Cách dùng: **tải tấm gốc (tấm số 1) lên trước**, rồi dán nguyên khối chữ bên dưới. Mỗi lần đều tải lại đúng tấm gốc ban đầu — đừng lấy tấm vừa tạo làm gốc cho tấm kế.

### 1. Serum dưỡng → `serum.jpg`
```
Keep the exact same model, face, framing, lighting, background, camera distance
and outfit as the reference image. Change only the hair to: sleek straight hair
with an intense liquid-glass shine, perfectly smooth cuticle, no frizz at all.
Portrait 3:4.
```

### 2. Dầu xả & Ủ tóc → `cond.jpg`
```
Keep the exact same model, face, framing, lighting, background, camera distance
and outfit as the reference image. Change only the hair to: soft loose waves,
deeply conditioned, silky and weighty with a satin sheen. Portrait 3:4.
```

### 3. Dầu gội → `shampoo.jpg`
```
Keep the exact same model, face, framing, lighting, background, camera distance
and outfit as the reference image. Change only the hair to: freshly washed hair,
clean and airy with soft natural movement, a few strands lifting lightly away
from the mass, light reflecting evenly along the lengths. Portrait 3:4.
```

### 4. Kích mọc tóc → `growth.jpg`
```
Keep the exact same model, face, framing, lighting, background, camera distance
and outfit as the reference image. Change only the hair to: noticeably thicker
and denser hair with strong healthy roots, natural volume at the crown, fine
baby hairs visible along the hairline. Portrait 3:4.
```

### 5. Sữa tắm → `bath.jpg`
```
Keep the exact same model, face, framing, lighting, background, camera distance
and outfit as the reference image. Change only the hair to: hair swept over one
shoulder, relaxed and softly dry, leaving the neck and one collarbone visible.
Portrait 3:4.
```

### 6. Chăm sóc da đầu → `scalp.jpg`
```
Keep the exact same model, face, framing, lighting, background, camera distance
and outfit as the reference image. Change only the hair to: hair parted cleanly
down the centre, smoothed to both sides, showing a healthy calm scalp and
clearly visible roots along the parting. Portrait 3:4.
```

---

## ⚠️ Watermark — xử lý trước khi đưa lên web

Ảnh do Gemini tạo có **dấu sao bốn cánh mờ ở góc dưới bên phải**. Nhìn lướt không thấy, nhưng để nguyên trên web bán hàng thì khách tinh mắt sẽ nhận ra là ảnh AI.

Cách bỏ: mở ảnh bằng Preview trên Mac → Tools → Crop → cắt bớt khoảng 8–10% chiều cao ở dưới. Khung ảnh trên web là 3:4 nên cắt xong vẫn vừa.

---

Nếu muốn **6 người khác nhau** (không phải một người 6 kiểu tóc), bỏ chữ `same model, face` ở đầu mỗi prompt và thêm dòng nhận dạng — ví dụ `mid-20s, oval face, softer jawline` / `early-30s, angular features`. Chỉ tả **kiểu người**, không mô tả một cá nhân có thật.

---

## Vì sao viết như vậy

- **`soft large-source studio lighting`** là thứ tạo ra cái nhìn của ảnh tham chiếu, hơn mọi tính từ khác. Đèn to, mềm, không đổ bóng gắt — đó là chuẩn ảnh quảng cáo mỹ phẩm.
- **`seamless warm cream beige backdrop`** giữ nền phẳng và đồng nhất. Nền phẳng còn giúp bạn tách nền sau này nếu muốn.
- **`85mm, shallow depth of field`** cho tỉ lệ khuôn mặt tự nhiên (ống kính rộng sẽ làm mặt bè ra), nền mờ nhẹ tách chủ thể.
- **`low contrast, matte finish`** tránh cái nhìn "ảnh AI bóng lộn" — đây là chỗ nhiều người bỏ quên nên ảnh trông giả.
- **`centred frontal, waist-up`** là điều kiện bắt buộc để 6 tấm hoán đổi khớp nhau.

---

## Muốn khác đi thì vặn chỗ nào

| Muốn gì | Sửa chữ nào |
|---|---|
| Sang hơn, ít "quảng cáo" hơn | `soft studio lighting` → `single window light from the side, deeper shadows` |
| Nền tối để hợp web xanh rêu hiện tại | `warm cream beige backdrop` → `deep muted green backdrop` |
| Ảnh film, bớt sạch sẽ | thêm `shot on Portra 400, subtle grain` |
| Nhìn thấy tóc rõ hơn | `waist-up` → `chest-up, hair filling the lower frame` |
| Trông Việt Nam hơn | `young East Asian woman` → `young Vietnamese woman` |

---

## Sau khi có ảnh

Bỏ 6 file vào cùng thư mục với `demo-hero.html`, đặt đúng tên ở bảng trên. Rồi mình sửa **một dòng code** là xong — hiệu ứng nhiễu, đổi màu nền, vị trí các mục, bản điện thoại giữ nguyên hết. Hướng dẫn chi tiết nằm ở cuối file `demo-hero.html`.
